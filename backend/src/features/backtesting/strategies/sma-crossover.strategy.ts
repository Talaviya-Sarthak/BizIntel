import { Signal, StrategyConfig, StrategyContext } from '../types';
import { Strategy } from './strategy.interface';

export class SmaCrossoverStrategy implements Strategy {
  readonly config: StrategyConfig = {
    id: 'sma-crossover',
    name: 'SMA Crossover',
    description: 'Simple Moving Average crossover strategy. Buys when short SMA crosses above long SMA, sells on the reverse.',
    parameters: [
      {
        name: 'shortWindow',
        label: 'Short SMA Window',
        type: 'number',
        default: 20,
        min: 5,
        max: 200,
        step: 1,
        description: 'Period for the short-term moving average',
      },
      {
        name: 'longWindow',
        label: 'Long SMA Window',
        type: 'number',
        default: 50,
        min: 10,
        max: 500,
        step: 1,
        description: 'Period for the long-term moving average',
      },
    ],
  };

  private shortWindow = 20;
  private longWindow = 50;
  private prevShortSma: number | null = null;
  private prevLongSma: number | null = null;

  initialize(params: Record<string, number>): void {
    this.shortWindow = params['shortWindow'] ?? this.config.parameters[0]!.default;
    this.longWindow = params['longWindow'] ?? this.config.parameters[1]!.default;
    this.prevShortSma = null;
    this.prevLongSma = null;
  }

  onBar(context: StrategyContext): Signal {
    const { bars, currentIndex } = context;

    if (currentIndex < this.longWindow - 1) {
      return { action: 'HOLD' };
    }

    const shortSma = this.calculateSma(bars, currentIndex, this.shortWindow);
    const longSma = this.calculateSma(bars, currentIndex, this.longWindow);

    if (shortSma === null || longSma === null) {
      return { action: 'HOLD' };
    }

    let signal: Signal = { action: 'HOLD' };

    if (this.prevShortSma !== null && this.prevLongSma !== null) {
      const prevDiff = this.prevShortSma - this.prevLongSma;
      const currDiff = shortSma - longSma;

      if (prevDiff <= 0 && currDiff > 0) {
        signal = { action: 'BUY' };
      } else if (prevDiff >= 0 && currDiff < 0) {
        signal = { action: 'SELL' };
      }
    }

    this.prevShortSma = shortSma;
    this.prevLongSma = longSma;

    return signal;
  }

  finalize(): void {
    this.prevShortSma = null;
    this.prevLongSma = null;
  }

  private calculateSma(
    bars: { close: number }[],
    endIndex: number,
    window: number,
  ): number | null {
    if (endIndex < window - 1) {
      return null;
    }

    let sum = 0;
    for (let i = endIndex - window + 1; i <= endIndex; i++) {
      sum += bars[i]!.close;
    }
    return sum / window;
  }
}
