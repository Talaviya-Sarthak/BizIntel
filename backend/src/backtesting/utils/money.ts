/**
 * Numeric helpers for the backtesting engine.
 *
 * Money is tracked in JS `number` (IEEE-754 double) which is fully
 * deterministic for the same input sequence on the same runtime. We round at
 * the storage boundary so NUMERIC columns never accumulate driver drift, and
 * we deliberately round to a fixed number of decimals everywhere so results
 * are reproducible and explainable.
 */

const MONEY_DECIMALS = 2;
const PRICE_DECIMALS = 6;

/** Rounds a money amount to 2 decimals (cash, equity, P&L, costs). */
export function roundMoney(value: number): number {
  return roundTo(value, MONEY_DECIMALS);
}

/** Rounds an execution price to 6 decimals. */
export function roundPrice(value: number): number {
  return roundTo(value, PRICE_DECIMALS);
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Clamps a value into [min, max]; NaN is replaced by `fallback`. */
export function clampNumber(value: number, min: number, max: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/** Whole-share sizing: a position quantity is always an integer ≥ 0. */
export function wholeShares(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.floor(Math.max(value, 0));
}

/** Standard deviation (sample, n-1) of an array. Empty/short arrays → null. */
export function sampleStdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
