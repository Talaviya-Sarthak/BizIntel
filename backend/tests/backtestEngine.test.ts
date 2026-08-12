import { describe, expect, it } from 'vitest';
import { runBacktest, type EngineConfig } from '../src/backtesting/engines/backtestEngine';
import type { Bar, Strategy } from '../src/backtesting/strategies/types';
import { trending, bar } from './helpers';

const scripted: Strategy = {
  id: 'scripted',
  name: 'Scripted',
  description: 'A deterministic scripted strategy for engine tests',
  executionModel: 'test only',
  parameters: [],
  defaults: {},
  validate: () => [],
  warmup: () => 0,
  createState: () => ({ count: 0 }),
  onBar: (state) => {
    (state as { count: number }).count += 1;
  },
  generateSignal: (state) => {
    const count = (state as { count: number }).count;
    if (count === 1) return 'BUY';
    if (count === 5) return 'SELL';
    return 'HOLD';
  },
};

const DEFAULT_ENGINE: EngineConfig = {
  initialCapital: 10_000,
  commission: 0,
  slippage: 0,
  parameters: {},
};

function run(bars: Bar[], config: Partial<EngineConfig> = {}) {
  return runBacktest(
    { symbol: 'T', bars, dateColumn: 'd', ohlcColumns: { open: 'o', high: 'h', low: 'l', close: 'c' }, volumeColumn: null, source: 'test' },
    scripted,
    { ...DEFAULT_ENGINE, ...config },
  );
}

describe('backtest engine', () => {
  it('executes signals at the NEXT bar open, never the signal bar', () => {
    const result = run(trending(8));

    expect(result.trades.length).toBe(2);
    const [buy, sell] = result.trades;
    expect(buy!.side).toBe('BUY');
    expect(buy!.timestamp).toBe(trending(8)[1]!.timestamp);
    expect(buy!.price).toBe(101);
    expect(sell!.side).toBe('SELL');
    expect(sell!.timestamp).toBe(trending(8)[5]!.timestamp);
    expect(sell!.price).toBe(105);
  });

  it('uses whole-share sizing without leverage and realizes correct P&L', () => {
    const result = run(trending(8));
    const [buy, sell] = result.trades;

    expect(buy!.quantity).toBe(99); // floor(10000 / 101)
    expect(sell!.quantity).toBe(99);
    expect(sell!.pnl).toBe(99 * 105 - 99 * 101);
    expect(result.finalEquity).toBe(10_000 + (99 * 105 - 99 * 101));
  });

  it('applies commission and slippage on both sides', () => {
    const result = run(trending(8), { commission: 0.001, slippage: 0.0005 });
    const [buy, sell] = result.trades;

    expect(buy!.price).toBeCloseTo(101 * 1.0005, 6); // open × (1 + slippage)
    expect(sell!.price).toBeCloseTo(105 * 0.9995, 6); // open × (1 − slippage)
    expect(buy!.commission).toBeCloseTo(9.9, 2);
    expect(sell!.commission).toBeCloseTo(10.28, 2);
    expect(buy!.slippageCost).toBeCloseTo(4.95, 2);
    expect(sell!.pnl).toBeCloseTo(361.73, 2);
  });

  it('never lets cash go negative and never holds a short position', () => {
    const result = run(trending(200), { commission: 0.001, slippage: 0.0005 });
    for (const point of result.equity) {
      expect(point.cash).toBeGreaterThanOrEqual(-1e-9);
      expect(point.positionValue).toBeGreaterThanOrEqual(0);
    }
    for (const trade of result.trades) {
      expect(trade.quantity).toBeGreaterThan(0);
    }
  });

  it('ignores a SELL when no position exists (never opens a short)', () => {
    const strategy: Strategy = {
      ...scripted,
      generateSignal: (state) => {
        const count = (state as { count: number }).count;
        if (count === 1) return 'SELL'; // no position — must be ignored
        if (count === 2) return 'BUY';
        return 'HOLD';
      },
    };
    const result = runBacktest(
      { symbol: 'T', bars: trending(6), dateColumn: 'd', ohlcColumns: { open: 'o', high: 'h', low: 'l', close: 'c' }, volumeColumn: null, source: 'test' },
      strategy,
      DEFAULT_ENGINE,
    );
    expect(result.trades.length).toBe(1);
    expect(result.trades[0]!.side).toBe('BUY');
    expect(result.trades[0]!.timestamp).toBe(trending(6)[2]!.timestamp);
  });

  it('computes a Buy & Hold benchmark over the same bars', () => {
    const bars = trending(50);
    const result = run(bars);
    expect(result.benchmarkEquity.length).toBe(bars.length);
    // Whole shares at the first open (100), no costs → equity = 100 × close.
    expect(result.benchmarkEquity[0]!.equity).toBe(100 * bars[0]!.close);
    expect(result.benchmarkEquity[result.benchmarkEquity.length - 1]!.equity).toBe(100 * bars[49]!.close);
  });

  it('is deterministic: identical inputs produce identical outputs', () => {
    const bars = trending(120);
    const a = run(bars, { commission: 0.001, slippage: 0.0005 });
    const b = run(bars, { commission: 0.001, slippage: 0.0005 });
    expect(a).toEqual(b);
  });

  it('produces a flat equity series when the strategy never trades', () => {
    const strategy: Strategy = {
      ...scripted,
      generateSignal: () => 'HOLD',
    };
    const result = runBacktest(
      { symbol: 'T', bars: trending(10), dateColumn: 'd', ohlcColumns: { open: 'o', high: 'h', low: 'l', close: 'c' }, volumeColumn: null, source: 'test' },
      strategy,
      DEFAULT_ENGINE,
    );
    expect(result.trades).toEqual([]);
    expect(result.equity[result.equity.length - 1]!.equity).toBe(10_000);
    expect(result.finalEquity).toBe(10_000);
  });
});
