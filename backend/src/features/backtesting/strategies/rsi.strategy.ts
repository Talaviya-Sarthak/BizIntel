import { Signal, StrategyConfig, StrategyContext } from '../types';
import { Strategy } from './strategy.interface';

export class RsiStrategy implements Strategy {
  readonly config: StrategyConfig = {
    id: 'rsi',
    name: 'RSI',
    description: 'Relative Strength Index strategy. Buys when RSI crosses above oversold level, sells when it crosses below overbought level.',
    parameters: [
      {
        name: 'period',
        label: 'RSI Period',
        type: 'number',
        default: 14,
        min: 2,
        max: 100,
        step: 1,
        description: 'Number of periods for RSI calculation',
      },
      {
        name: 'oversold',
        label: 'Oversold Level',
        type: 'number',
        default: 30,
        min: 10,
        max: 45,
        step: 1,
        description: 'RSI level considered oversold (buy signal)',
      },
      {
        name: 'overbought',
        label: 'Overbought Level',
        type: 'number',
        default: 70,
        min: 55,
        max: 90,
        step: 1,
        description: 'RSI level considered overbought (sell signal)',
      },
    ],
  };

  private period = 14;
  private oversold = 30;
  private overbought = 70;
  private gains: number[] = [];
  private losses: number[] = [];
  private avgGain: number | null = null;
  private avgLoss: number | null = null;
  private prevRsi: number | null = null;

  initialize(params: Record<string, number>): void {
    this.period = params['period'] ?? this.config.parameters[0]!.default;
    this.oversold = params['oversold'] ?? this.config.parameters[1]!.default;
    this.overbought = params['overbought'] ?? this.config.parameters[2]!.default;
    this.gains = [];
    this.losses = [];
    this.avgGain = null;
    this.avgLoss = null;
    this.prevRsi = null;
  }

  onBar(context: StrategyContext): Signal {
    const { bars, currentIndex } = context;

    if (currentIndex < 1) {
      return { action: 'HOLD' };
    }

    const change = bars[currentIndex]!.close - bars[currentIndex - 1]!.close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    this.gains.push(gain);
    this.losses.push(loss);

    const totalBarsNeeded = this.period + 1;
    if (currentIndex < totalBarsNeeded - 1) {
      return { action: 'HOLD' };
    }

    let rsi: number;

    if (this.avgGain === null || this.avgLoss === null) {
      let sumGain = 0;
      let sumLoss = 0;
      for (let i = 0; i < this.period; i++) {
        sumGain += this.gains[i]!;
        sumLoss += this.losses[i]!;
      }
      this.avgGain = sumGain / this.period;
      this.avgLoss = sumLoss / this.period;
    } else {
      this.avgGain = (this.avgGain * (this.period - 1) + gain) / this.period;
      this.avgLoss = (this.avgLoss * (this.period - 1) + loss) / this.period;
    }

    if (this.avgLoss === 0) {
      rsi = 100;
    } else if (this.avgGain === 0) {
      rsi = 0;
    } else {
      const rs = this.avgGain / this.avgLoss;
      rsi = 100 - 100 / (1 + rs);
    }

    let signal: Signal = { action: 'HOLD' };

    if (this.prevRsi !== null) {
      if (this.prevRsi <= this.oversold && rsi > this.oversold) {
        signal = { action: 'BUY' };
      } else if (this.prevRsi >= this.overbought && rsi < this.overbought) {
        signal = { action: 'SELL' };
      }
    }

    this.prevRsi = rsi;

    return signal;
  }

  finalize(): void {
    this.gains = [];
    this.losses = [];
    this.avgGain = null;
    this.avgLoss = null;
    this.prevRsi = null;
  }
}
