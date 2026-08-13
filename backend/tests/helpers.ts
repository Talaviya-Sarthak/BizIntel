import type { Bar } from '../src/backtesting/strategies/types';

const DAY = 86_400_000;

/** A simple OHLCV bar for tests. */
export function bar(price: number, i: number): Bar {
  return {
    timestamp: DAY * i,
    open: price,
    high: price + 1,
    low: price - 1,
    close: price,
    volume: 100,
  };
}

/** `n` bars of a steadily rising series, close = `start + i`. */
export function trending(n: number, start = 100): Bar[] {
  return Array.from({ length: n }, (_, i) => bar(start + i, i));
}

/**
 * A U-shaped series: declines for `down` bars, then climbs for `up` bars.
 * Useful for mean-reversion strategies (RSI, Bollinger).
 */
export function uShape(down: number, up: number, peak = 100): Bar[] {
  const closes: number[] = [];
  for (let i = 0; i < down; i += 1) closes.push(peak - i);
  const bottom = closes[closes.length - 1] ?? peak;
  for (let i = 1; i <= up; i += 1) closes.push(bottom + i);
  return closes.map((close, i) => bar(close, i));
}
