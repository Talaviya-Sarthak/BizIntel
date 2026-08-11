/**
 * Strategy abstraction for the backtesting engine.
 *
 * A strategy is a PURE, deterministic object: it receives one bar at a time in
 * chronological order via `onBar`, maintains its own indicator state, and
 * returns a controlled `Signal` from `generateSignal`. Strategies never touch
 * the database, the engine, or future data.
 */

export type Signal = 'BUY' | 'SELL' | 'HOLD';

/** A single OHLCV bar. `timestamp` is epoch milliseconds. */
export interface Bar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

/** Chronological OHLCV series produced by the market-data validation layer. */
export interface MarketData {
  symbol: string;
  bars: Bar[];
  dateColumn: string;
  ohlcColumns: { open: string; high: string; low: string; close: string };
  volumeColumn: string | null;
  source: string;
}

export type ParameterType = 'number' | 'integer' | 'boolean';

export interface ParameterDef {
  name: string;
  label: string;
  type: ParameterType;
  description: string;
  default: number | boolean;
  min?: number;
  max?: number;
  step?: number;
}

export type StrategyParameters = Record<string, number | boolean>;

/** Opaque per-run strategy state (indicators, rolling values, previous signals). */
export interface StrategyState {
  [key: string]: unknown;
}

export interface Strategy {
  /** Stable registry id, e.g. `sma_crossover`. */
  id: string;
  name: string;
  description: string;
  /** Human description of when signals are generated and executed. */
  executionModel: string;
  /** Parameter metadata consumed by the API + dynamic frontend form. */
  parameters: ParameterDef[];
  defaults: StrategyParameters;
  /** Returns a list of human-readable parameter problems (empty = valid). */
  validate(parameters: StrategyParameters): string[];
  /** Number of bars required before a signal may be emitted. */
  warmup(parameters: StrategyParameters): number;
  createState(): StrategyState;
  /** Feeds one bar (index `index`) to the strategy. Only bars ≤ `index` exist here. */
  onBar(state: StrategyState, bar: Bar, index: number, parameters: StrategyParameters): void;
  /** Returns the signal based on state accumulated so far (never future data). */
  generateSignal(state: StrategyState, parameters: StrategyParameters): Signal;
}
