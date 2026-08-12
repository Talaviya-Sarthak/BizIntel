import type { Strategy, StrategyParameters, StrategyState, Signal, Bar } from './types';

const PARAMETER_DEFS = [
  {
    name: 'period',
    label: 'RSI period',
    type: 'integer' as const,
    description: 'Look-back period for Wilder\u2019s RSI (bars).',
    default: 14,
    min: 2,
    max: 200,
    step: 1,
  },
  {
    name: 'oversold',
    label: 'Oversold threshold',
    type: 'number' as const,
    description: 'RSI below this level is considered oversold (buy trigger).',
    default: 30,
    min: 1,
    max: 99,
    step: 1,
  },
  {
    name: 'overbought',
    label: 'Overbought threshold',
    type: 'number' as const,
    description: 'RSI above this level is considered overbought (sell trigger).',
    default: 70,
    min: 1,
    max: 99,
    step: 1,
  },
];

/**
 * RSI Mean Reversion.
 *
 * Uses Wilder\u2019s RSI. LONG ONLY and fully deterministic — signals only fire
 * on a threshold CROSS, so the same series always produces the same trades:
 *
 *   - BUY when RSI crosses BELOW the oversold level,
 *   - SELL when RSI crosses ABOVE the overbought level,
 *   - HOLD otherwise.
 *
 * The RSI is maintained incrementally (Wilder smoothing) in O(1) per bar.
 */
export const rsiStrategy: Strategy = {
  id: 'rsi',
  name: 'RSI Mean Reversion',
  description:
    'Buys when the Relative Strength Index is oversold and sells when it turns overbought, expecting mean reversion.',
  executionModel:
    'Signals are generated on the bar close and executed at the NEXT bar open, at the market open price plus transaction costs.',
  parameters: PARAMETER_DEFS,
  defaults: { period: 14, oversold: 30, overbought: 70 },

  validate(parameters: StrategyParameters): string[] {
    const period = intParam(parameters, 'period', 14);
    const oversold = numParam(parameters, 'oversold', 30);
    const overbought = numParam(parameters, 'overbought', 70);
    const errors: string[] = [];
    if (period < 2 || period > 200) errors.push('RSI period must be between 2 and 200.');
    if (oversold < 1 || oversold > 99) errors.push('Oversold threshold must be between 1 and 99.');
    if (overbought < 1 || overbought > 99) errors.push('Overbought threshold must be between 1 and 99.');
    if (oversold >= overbought) errors.push('Oversold threshold must be below overbought threshold.');
    return errors;
  },

  warmup(parameters: StrategyParameters): number {
    return intParam(parameters, 'period', 14) + 1;
  },

  createState(): StrategyState {
    return {
      closes: [] as number[],
      avgGain: 0,
      avgLoss: 0,
      rsi: null as number | null,
      prevRsi: null as number | null,
      prevSignal: 'HOLD' as Signal,
    };
  },

  onBar(state: StrategyState, bar: Bar, _index: number, parameters: StrategyParameters): void {
    const period = intParam(parameters, 'period', 14);
    const closes = state.closes as number[];
    closes.push(bar.close);

    if (closes.length === 1) return;

    const delta = closes[closes.length - 1]! - closes[closes.length - 2]!;
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;

    if (closes.length <= period + 1) {
      // Accumulate the first `period` deltas, then average.
      state.avgGain = (state.avgGain as number) + gain;
      state.avgLoss = (state.avgLoss as number) + loss;
      if (closes.length === period + 1) {
        state.avgGain = (state.avgGain as number) / period;
        state.avgLoss = (state.avgLoss as number) / period;
      }
    } else {
      state.avgGain = ((state.avgGain as number) * (period - 1) + gain) / period;
      state.avgLoss = ((state.avgLoss as number) * (period - 1) + loss) / period;
    }

    if (closes.length >= period + 1) {
      const avgLoss = state.avgLoss as number;
      state.rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + (state.avgGain as number) / avgLoss);
    }
  },

  generateSignal(state: StrategyState, parameters: StrategyParameters): Signal {
    const oversold = numParam(parameters, 'oversold', 30);
    const overbought = numParam(parameters, 'overbought', 70);

    const rsi = state.rsi as number | null;
    if (rsi === null) return 'HOLD';

    const prevRsi = state.prevRsi as number | null;
    let signal: Signal = 'HOLD';

    if (prevRsi !== null) {
      if (rsi < oversold && prevRsi >= oversold) signal = 'BUY';
      else if (rsi > overbought && prevRsi <= overbought) signal = 'SELL';
    }

    state.prevRsi = rsi;
    state.prevSignal = signal;
    return signal;
  },
};

function intParam(parameters: StrategyParameters, name: string, fallback: number): number {
  const value = parameters[name];
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
}

function numParam(parameters: StrategyParameters, name: string, fallback: number): number {
  const value = parameters[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
