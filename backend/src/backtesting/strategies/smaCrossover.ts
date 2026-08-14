import type { Strategy, StrategyParameters, StrategyState, Signal, Bar } from './types.js';

const PARAMETER_DEFS = [
  {
    name: 'shortWindow',
    label: 'Short window',
    type: 'integer' as const,
    description: 'Period of the fast moving average (bars).',
    default: 20,
    min: 2,
    max: 500,
    step: 1,
  },
  {
    name: 'longWindow',
    label: 'Long window',
    type: 'integer' as const,
    description: 'Period of the slow moving average (bars).',
    default: 50,
    min: 2,
    max: 1000,
    step: 1,
  },
];

/**
 * SMA Crossover — trend following.
 *
 * Computes a fast (short) and a slow (long) simple moving average of closes.
 * The strategy is fully LONG ONLY and deterministic:
 *
 *   - BUY when the short MA crosses ABOVE the long MA,
 *   - SELL when the short MA crosses BELOW the long MA,
 *   - HOLD otherwise (only first cross is acted on).
 *
 * Indicator state is maintained incrementally (rolling sums) so each bar is
 * O(1) and never reads beyond the bar currently being processed.
 */
export const smaCrossoverStrategy: Strategy = {
  id: 'sma_crossover',
  name: 'SMA Crossover',
  description:
    'Trend-following strategy that trades the crossing of a short-term and a long-term simple moving average.',
  executionModel:
    'Signals are generated on the bar close and executed at the NEXT bar open, at the market open price plus transaction costs.',
  parameters: PARAMETER_DEFS,
  defaults: { shortWindow: 20, longWindow: 50 },

  validate(parameters: StrategyParameters): string[] {
    const short = intParam(parameters, 'shortWindow', 20);
    const long = intParam(parameters, 'longWindow', 50);
    const errors: string[] = [];
    if (short < 2 || short > 500) errors.push('Short window must be between 2 and 500.');
    if (long < 2 || long > 1000) errors.push('Long window must be between 2 and 1000.');
    if (short >= long) errors.push('Short window must be smaller than long window.');
    return errors;
  },

  warmup(parameters: StrategyParameters): number {
    return intParam(parameters, 'longWindow', 50);
  },

  createState(): StrategyState {
    return {
      closes: [] as number[],
      shortSum: 0,
      longSum: 0,
      prevShort: null as number | null,
      prevLong: null as number | null,
      prevSignal: 'HOLD' as Signal,
    };
  },

  onBar(state: StrategyState, bar: Bar, _index: number, parameters: StrategyParameters): void {
    const short = intParam(parameters, 'shortWindow', 20);
    const long = intParam(parameters, 'longWindow', 50);
    const closes = state.closes as number[];
    closes.push(bar.close);
    const length = closes.length;

    state.shortSum = (state.shortSum as number) + bar.close;
    if (length > short) state.shortSum = (state.shortSum as number) - (closes[length - short - 1] ?? 0);

    state.longSum = (state.longSum as number) + bar.close;
    if (length > long) state.longSum = (state.longSum as number) - (closes[length - long - 1] ?? 0);
  },

  generateSignal(state: StrategyState, parameters: StrategyParameters): Signal {
    const short = intParam(parameters, 'shortWindow', 20);
    const long = intParam(parameters, 'longWindow', 50);
    const closes = state.closes as number[];

    if (closes.length < long) return 'HOLD';

    const shortSma = (state.shortSum as number) / short;
    const longSma = (state.longSum as number) / long;
    const prevShort = state.prevShort as number | null;
    const prevLong = state.prevLong as number | null;

    let signal: Signal = 'HOLD';
    if (prevShort !== null && prevLong !== null) {
      if (shortSma > longSma && prevShort <= prevLong) signal = 'BUY';
      else if (shortSma < longSma && prevShort >= prevLong) signal = 'SELL';
    }

    state.prevShort = shortSma;
    state.prevLong = longSma;
    state.prevSignal = signal;
    return signal;
  },
};

function intParam(parameters: StrategyParameters, name: string, fallback: number): number {
  const value = parameters[name];
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
}
