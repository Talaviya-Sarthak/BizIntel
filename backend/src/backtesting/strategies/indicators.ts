/**
 * Indicator helpers. All functions are evaluated from the series prefix
 * available AT the current index only — they never touch later bars, which is
 * the foundation of the engine's look-ahead prevention model.
 */

/** Simple moving average of `window` values ending at `index` (inclusive). */
export function smaAt(values: number[], window: number, index: number): number | null {
  const start = index - window + 1;
  if (start < 0) return null;
  let sum = 0;
  for (let i = start; i <= index; i += 1) sum += values[i] ?? 0;
  return sum / window;
}

/** Population standard deviation of `window` values ending at `index`. */
export function populationStdDevAt(
  values: number[],
  window: number,
  index: number,
): number | null {
  const start = index - window + 1;
  if (start < 0) return null;
  const slice = values.slice(start, index + 1);
  const mean = slice.reduce((sum, value) => sum + value, 0) / window;
  const variance = slice.reduce((sum, value) => sum + (value - mean) ** 2, 0) / window;
  return Math.sqrt(variance);
}

/**
 * Wilder's RSI evaluated at `index`, using `period` back values.
 * Returns null until `index >= period` (enough deltas exist).
 */
export function rsiAt(
  values: number[],
  period: number,
  index: number,
): number | null {
  if (index < period || period <= 0) return null;

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average over the first `period` deltas (indexes 1..period).
  for (let i = 1; i <= period; i += 1) {
    const delta = (values[i] ?? 0) - (values[i - 1] ?? 0);
    if (delta > 0) avgGain += delta;
    else avgLoss += -delta;
  }
  avgGain /= period;
  avgLoss /= period;

  // Wilder smoothing for each subsequent delta.
  for (let i = period + 1; i <= index; i += 1) {
    const delta = (values[i] ?? 0) - (values[i - 1] ?? 0);
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export interface BollingerBand {
  middle: number;
  upper: number;
  lower: number;
}

/** Bollinger Bands at `index`: SMA middle + `multiplier` stddev bands. */
export function bollingerAt(
  values: number[],
  period: number,
  multiplier: number,
  index: number,
): BollingerBand | null {
  if (index < period - 1 || period <= 0) return null;
  const middle = smaAt(values, period, index);
  const stddev = populationStdDevAt(values, period, index);
  if (middle === null || stddev === null) return null;
  return {
    middle,
    upper: middle + multiplier * stddev,
    lower: middle - multiplier * stddev,
  };
}
