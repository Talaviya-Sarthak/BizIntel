import { describe, expect, it } from 'vitest';
import { smaCrossoverStrategy } from '../src/backtesting/strategies/smaCrossover.js';
import { rsiStrategy } from '../src/backtesting/strategies/rsi.js';
import { bollingerBandsStrategy } from '../src/backtesting/strategies/bollingerBands.js';
import { strategyRegistry } from '../src/backtesting/strategies/registry.js';
import { runBacktest } from '../src/backtesting/engines/backtestEngine.js';
import { smaAt, rsiAt, populationStdDevAt } from '../src/backtesting/strategies/indicators.js';
import { bar, trending, uShape } from './helpers.js';
import type { Strategy, StrategyParameters, StrategyState, Signal, Bar } from '../src/backtesting/strategies/types.js';

describe('strategy metadata & validation', () => {
  it('registers all three strategies', () => {
    const ids = strategyRegistry.list().map((strategy) => strategy.id);
    expect(ids).toEqual(expect.arrayContaining(['sma_crossover', 'rsi', 'bollinger_bands']));
    expect(strategyRegistry.has('sma_crossover')).toBe(true);
    expect(strategyRegistry.get('nope')).toBeUndefined();
  });

  it('validates default parameters for every strategy', () => {
    for (const strategy of strategyRegistry.list()) {
      expect(strategy.validate(strategy.defaults)).toEqual([]);
    }
  });

  it('sma_crossover rejects invalid windows', () => {
    expect(smaCrossoverStrategy.validate({ shortWindow: 50, longWindow: 20 })).not.toEqual([]);
    expect(smaCrossoverStrategy.validate({ shortWindow: 1, longWindow: 50 })).not.toEqual([]);
    expect(smaCrossoverStrategy.warmup({ shortWindow: 10, longWindow: 40 })).toBe(40);
  });

  it('rsi rejects inverted thresholds and reports warmup = period + 1', () => {
    expect(rsiStrategy.validate({ period: 14, oversold: 70, overbought: 30 })).not.toEqual([]);
    expect(rsiStrategy.validate({ period: 14, oversold: 99, overbought: 100 })).not.toEqual([]);
    expect(rsiStrategy.warmup({ period: 14 })).toBe(15);
  });

  it('bollinger rejects out-of-range std deviation', () => {
    expect(bollingerBandsStrategy.validate({ period: 20, stdDev: 6 })).not.toEqual([]);
    expect(bollingerBandsStrategy.validate({ period: 20, stdDev: 0 })).not.toEqual([]);
    expect(bollingerBandsStrategy.warmup({ period: 20 })).toBe(20);
  });
});

describe('strategy execution behaviour (via engine)', () => {
  function tradesFor(strategy: Strategy, bars: Bar[], parameters?: StrategyParameters) {
    const params: StrategyParameters = { ...strategy.defaults, ...(parameters ?? {}) };
    const result = runBacktest(
      { symbol: 'T', bars, dateColumn: 'date', ohlcColumns: { open: 'open', high: 'high', low: 'low', close: 'close' }, volumeColumn: null, source: 'test' },
      strategy,
      { initialCapital: 10_000, commission: 0, slippage: 0, parameters: params },
    );
    return result.trades;
  }

  it('sma_crossover buys on a golden cross in an uptrend and holds', () => {
    // Flat for 40 bars (fast SMA == slow SMA), then a sustained rise.
    const closes = [
      ...Array.from({ length: 40 }, () => 100),
      ...Array.from({ length: 40 }, (_, i) => 101 + i),
    ];
    const bars = closes.map((close, i) => bar(close, i));
    const trades = tradesFor(smaCrossoverStrategy, bars, { shortWindow: 5, longWindow: 20 });
    expect(trades.length).toBe(1);
    expect(trades[0]!.side).toBe('BUY');
    expect(trades[0]!.quantity).toBeGreaterThan(0);
  });

  it('rsi mean-reversion buys oversold and sells overbought', () => {
    // Flat, then a sharp sell-off, then a sustained recovery.
    const closes = [
      ...Array.from({ length: 8 }, () => 100),
      95, 90, 85, 80, 75, 70, 65, 60,
      ...Array.from({ length: 20 }, (_, i) => 60 + i * 2),
    ];
    const bars = closes.map((close, i) => bar(close, i));
    const trades = tradesFor(rsiStrategy, bars, { period: 5, oversold: 30, overbought: 70 });
    expect(trades.length).toBeGreaterThanOrEqual(2);
    expect(trades[0]!.side).toBe('BUY');
    expect(trades[trades.length - 1]!.side).toBe('SELL');
  });

  it('bollinger mean-reversion buys below the lower band and sells at the middle', () => {
    const bars = uShape(12, 25, 100);
    const trades = tradesFor(bollingerBandsStrategy, bars, { period: 8, stdDev: 1.5 });
    expect(trades.length).toBeGreaterThanOrEqual(2);
    expect(trades[0]!.side).toBe('BUY');
    expect(trades[trades.length - 1]!.side).toBe('SELL');
  });

  it('strategies never emit an open position at the final bar (look-ahead by construction)', () => {
    // A BUY signalled on the very last bar must never execute (no next open).
    const scripted: Strategy = {
      id: 'last_bar_buy',
      name: 'Scripted',
      description: 'test',
      executionModel: 'test',
      parameters: [],
      defaults: {},
      validate: () => [],
      warmup: () => 0,
      createState: () => ({ n: 0 }),
      onBar: (state) => {
        (state as { n: number }).n += 1;
      },
      generateSignal: (state) => ((state as { n: number }).n === 3 ? 'BUY' : 'HOLD'),
    };
    const result = runBacktest(
      { symbol: 'T', bars: trending(3), dateColumn: 'd', ohlcColumns: { open: 'o', high: 'h', low: 'l', close: 'c' }, volumeColumn: null, source: 'test' },
      scripted,
      { initialCapital: 10_000, commission: 0, slippage: 0, parameters: {} },
    );
    expect(result.trades.length).toBe(0);
  });
});

describe('indicator helpers', () => {
  it('smaAt uses only the prefix up to the index', () => {
    const values = [1, 2, 3, 4, 5];
    expect(smaAt(values, 3, 2)).toBe(2);
    expect(smaAt(values, 3, 0)).toBeNull();
    expect(smaAt(values, 3, 4)).toBe(4);
  });

  it('populationStdDevAt returns the population (n) standard deviation', () => {
    expect(populationStdDevAt([2, 4, 4, 4, 5, 5, 7, 9], 8, 7)).toBeCloseTo(2.0, 10);
  });

  it('rsiAt is 100 for a purely rising series', () => {
    const values = [10, 11, 12, 13, 14, 15];
    expect(rsiAt(values, 3, 5)).toBe(100);
  });

  it('rsiAt is bounded and deterministic', () => {
    const values = [10, 9, 11, 8, 12, 7];
    const rsi = rsiAt(values, 3, 5)!;
    expect(rsi).toBeGreaterThan(0);
    expect(rsi).toBeLessThan(100);
    expect(rsi).toBe(rsiAt(values, 3, 5)!);
  });
});
