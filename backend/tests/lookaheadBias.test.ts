import { describe, expect, it } from 'vitest';
import { runBacktest } from '../src/backtesting/engines/backtestEngine';
import { smaCrossoverStrategy } from '../src/backtesting/strategies/smaCrossover';
import { rsiStrategy } from '../src/backtesting/strategies/rsi';
import { bollingerBandsStrategy } from '../src/backtesting/strategies/bollingerBands';
import { strategyRegistry } from '../src/backtesting/strategies/registry';
import type { Bar, Strategy, StrategyParameters } from '../src/backtesting/strategies/types';
import { bar } from './helpers';

/**
 * LOOK-AHEAD BIAS REGRESSION TEST.
 *
 * If a strategy ever read future data, its last signal/equity points would
 * change when we delete the final bar. Here we run every strategy on the full
 * series and on the same series truncated by one bar; everything up to the
 * truncation point must be bit-for-bit identical (same trades, same equity).
 */
function syntheticSeries(length: number): Bar[] {
  const closes: number[] = [];
  for (let i = 0; i < length; i += 1) {
    // A noisy, slowly rising series with a drawdown bump in the middle.
    const trend = 100 + i * 0.2;
    const wave = Math.sin(i / 4) * 6;
    const dip = i > length * 0.4 && i < length * 0.55 ? -(i - length * 0.4) * 0.5 : 0;
    closes.push(trend + wave + dip);
  }
  return closes.map((close, i) =>
    bar(close, i),
  );
}

function runAll(bars: Bar[]) {
  const results = new Map<string, unknown>();
  for (const strategy of strategyRegistry.list()) {
    const params = strategy.defaults;
    results.set(strategy.id, runBacktest(
      { symbol: 'T', bars, dateColumn: 'd', ohlcColumns: { open: 'o', high: 'h', low: 'l', close: 'c' }, volumeColumn: null, source: 'test' },
      strategy,
      { initialCapital: 10_000, commission: 0.001, slippage: 0.0005, parameters: params },
    ));
  }
  return results;
}

describe('look-ahead bias regression', () => {
  it('removing the final bar changes nothing before the end for every strategy', () => {
    const full = syntheticSeries(200);
    const truncated = full.slice(0, -1);

    const fullResults = runAll(full);
    const truncatedResults = runAll(truncated);

    for (const strategy of strategyRegistry.list()) {
      const a = fullResults.get(strategy.id) as ReturnType<typeof runBacktest>;
      const b = truncatedResults.get(strategy.id) as ReturnType<typeof runBacktest>;

      expect(a.trades).toEqual(b.trades);
      expect(a.equity.slice(0, b.equity.length)).toEqual(b.equity);
      expect(a.benchmarkEquity.slice(0, b.benchmarkEquity.length)).toEqual(b.benchmarkEquity);
    }
  });

  it('also holds for configured parameter variants', () => {
    const variants: { strategy: Strategy; parameters: StrategyParameters }[] = [
      { strategy: smaCrossoverStrategy, parameters: { shortWindow: 10, longWindow: 30 } },
      { strategy: rsiStrategy, parameters: { period: 7, oversold: 25, overbought: 75 } },
      { strategy: bollingerBandsStrategy, parameters: { period: 12, stdDev: 2.5 } },
    ];

    const full = syntheticSeries(300);
    const truncated = full.slice(0, -1);

    for (const { strategy, parameters } of variants) {
      const config = { initialCapital: 10_000, commission: 0.001, slippage: 0.0005, parameters };
      const market = (bars: Bar[]) => ({
        symbol: 'T', bars, dateColumn: 'd', ohlcColumns: { open: 'o', high: 'h', low: 'l', close: 'c' }, volumeColumn: null, source: 'test',
      });
      const a = runBacktest(market(full), strategy, config);
      const b = runBacktest(market(truncated), strategy, config);

      expect(a.trades).toEqual(b.trades);
      expect(a.equity.slice(0, b.equity.length)).toEqual(b.equity);
    }
  });
});
