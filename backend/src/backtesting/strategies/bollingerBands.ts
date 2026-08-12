import type { Strategy, StrategyParameters, StrategyState, Signal, Bar } from './types';

const PARAMETER_DEFS = [
  {
    name: 'period',
    label: 'Band period',
    type: 'integer' as const,
    description: 'SMA look-back period for the middle band (bars).',
    default: 20,
    min: 2,
    max: 500,
    step: 1,
  },
  {
    name: 'stdDev',
    label: 'Std deviation multiplier',
    type: 'number' as const,
    description: 'Number of standard deviations for the upper/lower bands.',
    default: 2,
    min: 0.1,
    max: 5,
    step: 0.1,
  },
];

/**
 * Bollinger Bands Mean Reversion.
 *
 * Computes the middle band (SMA of closes) and upper/lower bands
 * (middle ± multiplier × population stddev). LONG ONLY and deterministic:
 *
 *   - BUY when close crosses BELOW the lower band (oversold vs the bands),
 *   - SELL when close crosses ABOVE the middle band (mean reversion target),
 *   - HOLD otherwise.
 *
 * Bands are maintained with rolling sum / sum-of-squares in O(1) per bar.
 */
export const bollingerBandsStrategy: Strategy = {
  id: 'bollinger_bands',
  name: 'Bollinger Bands',
  description:
    'Mean-reversion strategy that buys below the lower band and sells back above the middle band.',
  executionModel:
    'Signals are generated on the bar close and executed at the NEXT bar open, at the market open price plus transaction costs.',
  parameters: PARAMETER_DEFS,
  defaults: { period: 20, stdDev: 2 },

  validate(parameters: StrategyParameters): string[] {
    const period = intParam(parameters, 'period', 20);
    const stdDev = numParam(parameters, 'stdDev', 2);
    const errors: string[] = [];
    if (period < 2 || period > 500) errors.push('Band period must be between 2 and 500.');
    if (stdDev < 0.1 || stdDev > 5) errors.push('Std deviation multiplier must be between 0.1 and 5.');
    return errors;
  },

  warmup(parameters: StrategyParameters): number {
    return intParam(parameters, 'period', 20);
  },

  createState(): StrategyState {
    return {
      closes: [] as number[],
      sum: 0,
      sumSq: 0,
      prevClose: null as number | null,
      prevSignal: 'HOLD' as Signal,
    };
  },

  onBar(state: StrategyState, bar: Bar, _index: number, parameters: StrategyParameters): void {
    const period = intParam(parameters, 'period', 20);
    const closes = state.closes as number[];
    closes.push(bar.close);
    const length = closes.length;

    state.sum = (state.sum as number) + bar.close;
    state.sumSq = (state.sumSq as number) + bar.close * bar.close;
    if (length > period) {
      const removed = closes[length - period - 1] ?? 0;
      state.sum = (state.sum as number) - removed;
      state.sumSq = (state.sumSq as number) - removed * removed;
    }
  },

  generateSignal(state: StrategyState, parameters: StrategyParameters): Signal {
    const period = intParam(parameters, 'period', 20);
    const multiplier = numParam(parameters, 'stdDev', 2);
    const closes = state.closes as number[];

    if (closes.length < period) return 'HOLD';

    const mean = (state.sum as number) / period;
    const variance = Math.max((state.sumSq as number) / period - mean * mean, 0);
    const stddev = Math.sqrt(variance);
    const lower = mean - multiplier * stddev;
    const middle = mean;
    const close = closes[closes.length - 1]!;
    const prevClose = state.prevClose as number | null;

    let signal: Signal = 'HOLD';
    if (prevClose !== null) {
      if (close < lower && prevClose >= lower) signal = 'BUY';
      else if (close > middle && prevClose <= middle) signal = 'SELL';
    }

    state.prevClose = close;
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
