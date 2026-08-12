import { Signal, StrategyConfig, StrategyContext } from '../types';
import { Strategy } from './strategy.interface';

export class BollingerBandsStrategy implements Strategy {
  readonly config: StrategyConfig = {
    id: 'bollinger-bands',
    name: 'Bollinger Bands',
    description: 'Bollinger Bands strategy. Buys when price crosses above lower band from below, sells when price crosses below upper band from above.',
    parameters: [
      {
        name: 'period',
        label: 'Period',
        type: 'number',
        default: 20,
        min: 5,
        max: 100,
        step: 1,
        description: 'Number of periods for the middle band SMA',
      },
      {
        name: 'stdDev',
        label: 'Standard Deviation Multiplier',
        type: 'number',
        default: 2,
        min: 0.5,
        max: 4,
        step: 0.1,
        description: 'Number of standard deviations for upper and lower bands',
      },
    ],
  };

  private period = 20;
  private stdDevMultiplier = 2;
  private prevPrice: number | null = null;
  private prevLowerBand: number | null = null;
  private prevUpperBand: number | null = null;

  initialize(params: Record<string, number>): void {
    this.period = params['period'] ?? this.config.parameters[0]!.default;
    this.stdDevMultiplier = params['stdDev'] ?? this.config.parameters[1]!.default;
    this.prevPrice = null;
    this.prevLowerBand = null;
    this.prevUpperBand = null;
  }

  onBar(context: StrategyContext): Signal {
    const { bars, currentIndex } = context;

    if (currentIndex < this.period - 1) {
      return { action: 'HOLD' };
    }

    const closes: number[] = [];
    for (let i = currentIndex - this.period + 1; i <= currentIndex; i++) {
      closes.push(bars[i]!.close);
    }

    const middleBand = this.calculateSma(closes);
    const stdDev = this.calculateStdDev(closes, middleBand);
    const upperBand = middleBand + this.stdDevMultiplier * stdDev;
    const lowerBand = middleBand - this.stdDevMultiplier * stdDev;

    const currentPrice = bars[currentIndex]!.close;

    let signal: Signal = { action: 'HOLD' };

    if (
      this.prevPrice !== null &&
      this.prevLowerBand !== null &&
      this.prevUpperBand !== null
    ) {
      if (this.prevPrice <= this.prevLowerBand && currentPrice > lowerBand) {
        signal = { action: 'BUY' };
      } else if (this.prevPrice >= this.prevUpperBand && currentPrice < upperBand) {
        signal = { action: 'SELL' };
      }
    }

    this.prevPrice = currentPrice;
    this.prevLowerBand = lowerBand;
    this.prevUpperBand = upperBand;

    return signal;
  }

  finalize(): void {
    this.prevPrice = null;
    this.prevLowerBand = null;
    this.prevUpperBand = null;
  }

  private calculateSma(values: number[]): number {
    let sum = 0;
    for (const v of values) {
      sum += v;
    }
    return sum / values.length;
  }

  private calculateStdDev(values: number[], mean: number): number {
    let sumSquaredDiff = 0;
    for (const v of values) {
      const diff = v - mean;
      sumSquaredDiff += diff * diff;
    }
    return Math.sqrt(sumSquaredDiff / values.length);
  }
}
