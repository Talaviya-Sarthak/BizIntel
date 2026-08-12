import { describe, it, expect } from 'vitest';
import { BacktestEngine, BacktestEngineConfig } from '../engines/backtest.engine';
import { Strategy } from '../strategies/strategy.interface';
import { MarketBar, Signal, StrategyContext, StrategyConfig } from '../types';
import { SmaCrossoverStrategy } from '../strategies/sma-crossover.strategy';

function createBar(date: string, open: number, close: number): MarketBar {
  const h = Math.max(open, close) + 2;
  const l = Math.min(open, close) - 2;
  return { timestamp: new Date(date), open: open, high: h, low: l, close, volume: 1000 };
}

function createBars(dates: string[], opens: number[], closes: number[]): MarketBar[] {
  return dates.map((d, i) => createBar(d, opens[i]!, closes[i]!));
}

function makeDates(count: number): string[] {
  const result: string[] = [];
  const base = new Date('2024-01-01');
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    result.push(d.toISOString().split('T')[0]!);
  }
  return result;
}

function defaultConfig(): BacktestEngineConfig {
  return { initialCapital: 10000, commission: 0, slippage: 0 };
}

// ──────────── CRITICAL: Look-ahead Bias Prevention ─────────────

describe('Look-ahead bias prevention (CRITICAL)', () => {
  /**
   * SCENARIO: Create a dataset where at bar 40, the price is stable (100).
   * At bar 41, there is a dramatic crash to 40.
   *
   * If a strategy could see future data at bar 40, it would know the crash
   * is coming and sell at bar 40 to avoid losses. A correct implementation
   * should NOT have this behavior — the strategy at bar 40 only sees bar 40's data.
   */
  it('strategy at bar 40 CANNOT see the crash at bar 41', () => {
    class CrashAvoidanceStrategy implements Strategy {
      readonly config: StrategyConfig = {
        id: 'crash-avoidance',
        name: 'Crash Avoidance',
        description: 'Buys at bar 0, sells if price drops below 50',
        parameters: [],
      };
      initialize() {}
      onBar(ctx: StrategyContext): Signal {
        const bar = ctx.bars[ctx.currentIndex]!;
        if (ctx.currentIndex === 0) {
          return { action: 'BUY', quantity: 100 };
        }
        // This check ONLY sees bars[0..currentIndex]
        // If look-ahead bias exists, the strategy would somehow see bar 41's crash
        // at bar 40 and sell early
        if (bar.close < 50 && ctx.position > 0) {
          return { action: 'SELL', quantity: ctx.position };
        }
        return { action: 'HOLD' };
      }
      finalize() {}
    }

    const count = 50;
    const dates = makeDates(count);
    const opens: number[] = [];
    const closes: number[] = [];
    for (let i = 0; i < count; i++) {
      if (i < 41) {
        opens.push(100);
        closes.push(100);
      } else {
        opens.push(40);
        closes.push(40);
      }
    }
    const bars = createBars(dates, opens, closes);
    const engine = new BacktestEngine(defaultConfig());
    const result = engine.run(bars, new CrashAvoidanceStrategy());

    const sells = result.trades.filter((t) => t.side === 'SELL');

    // The crash happens at bar index 41.
    // At bar 40, price is 100 — strategy should NOT sell
    // At bar 41, price is 40 — strategy triggers sell, executes at bar 42's open

    // Verify the sell happens only AFTER the crash bar
    if (sells.length > 0) {
      // The sell's timestamp is the execution bar (bar index 42 or later)
      const sellTimestamp = sells[0]!.timestamp;
      const sellBarIndex = bars.findIndex(
        (b) => b.timestamp.getTime() === sellTimestamp.getTime()
      );
      // Sell must happen at or after index 42 (bar after crash at index 41)
      expect(sellBarIndex).toBeGreaterThanOrEqual(42);
    }

    // Also verify the strategy did NOT sell at or before bar 40 (before the crash)
    const preCrashSells = sells.filter((t) => {
      const idx = bars.findIndex(
        (b) => b.timestamp.getTime() === t.timestamp.getTime()
      );
      return idx >= 0 && idx <= 40;
    });
    expect(preCrashSells.length).toBe(0);
  });

  /**
   * SCENARIO: Record what bars the strategy sees at each step.
   * Verify the strategy at step T never has access to data from step T+1.
   */
  it('strategy context bars array length equals currentIndex + 1', () => {
    class LengthCheckStrategy implements Strategy {
      readonly config: StrategyConfig = {
        id: 'length-check',
        name: 'Length Check',
        description: 'Verifies context bars length',
        parameters: [],
      };
      violations: number[] = [];
      initialize() {}
      onBar(ctx: StrategyContext): Signal {
        // The context should ONLY contain bars[0..currentIndex]
        if (ctx.bars.length !== ctx.currentIndex + 1) {
          this.violations.push(ctx.currentIndex);
        }
        return { action: 'HOLD' };
      }
      finalize() {}
    }

    const count = 100;
    const prices = Array.from({ length: count }, (_, i) => 100 + Math.sin(i) * 10);
    const dates = makeDates(count);
    const bars = createBars(dates, prices, prices);
    const engine = new BacktestEngine(defaultConfig());
    const strategy = new LengthCheckStrategy();
    engine.run(bars, strategy);

    // CRITICAL: No violations should ever occur
    expect(strategy.violations).toEqual([]);
  });

  /**
   * SCENARIO: Run the same SMA crossover strategy twice — once with full data,
   * once by running bar-by-bar manually. Results must be identical.
   * This proves the engine doesn't leak future data to the strategy.
   */
  it('full run produces same trades as incremental simulation', () => {
    const count = 30;
    const dates = makeDates(count);
    const closes = [
      100, 102, 104, 103, 101, 99, 97, 95, 93, 91,
      89, 91, 93, 95, 97, 99, 101, 103, 105, 107,
      109, 111, 113, 115, 117, 119, 121, 123, 125, 127,
    ];
    const opens = closes.map((c) => c - 1);
    const bars = createBars(dates, opens, closes);

    // Full run
    const engine1 = new BacktestEngine(defaultConfig());
    const strategy1 = new SmaCrossoverStrategy();
    strategy1.initialize({ shortWindow: 5, longWindow: 10 });
    const result1 = engine1.run(bars, strategy1);

    // Run bar by bar — each incremental run processes one more bar
    const incrementalTrades: Array<{ side: string; quantity: number; timestamp: number }> = [];
    for (let i = 0; i < bars.length; i++) {
      const partialBars = bars.slice(0, i + 1);
      const s = new SmaCrossoverStrategy();
      s.initialize({ shortWindow: 5, longWindow: 10 });
      const partialResult = new BacktestEngine(defaultConfig()).run(partialBars, s);
      for (const trade of partialResult.trades) {
        const key = `${trade.side}-${trade.quantity}-${trade.timestamp.getTime()}`;
        if (!incrementalTrades.find((t) => `${t.side}-${t.quantity}-${t.timestamp}` === key)) {
          incrementalTrades.push({
            side: trade.side,
            quantity: trade.quantity,
            timestamp: trade.timestamp.getTime(),
          });
        }
      }
    }

    const fullTradeSummary = result1.trades.map((t) => ({
      side: t.side,
      quantity: t.quantity,
      timestamp: t.timestamp.getTime(),
    }));

    expect(fullTradeSummary).toEqual(incrementalTrades);
  });

  /**
   * SCENARIO: Verify the engine never modifies the bars array passed to it.
   * If the engine accidentally sorts or appends to bars, it could leak data.
   */
  it('engine does not mutate the input bars array', () => {
    const dates = makeDates(5);
    const opens = [100, 101, 102, 103, 104];
    const closes = [101, 102, 103, 104, 105];
    const bars = createBars(dates, opens, closes);
    const originalBars = bars.map((b) => ({
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    const engine = new BacktestEngine(defaultConfig());
    engine.run(bars, new SmaCrossoverStrategy());

    for (let i = 0; i < bars.length; i++) {
      expect(bars[i]!.open).toBe(originalBars[i]!.open);
      expect(bars[i]!.close).toBe(originalBars[i]!.close);
      expect(bars[i]!.high).toBe(originalBars[i]!.high);
      expect(bars[i]!.low).toBe(originalBars[i]!.low);
    }
  });

  /**
   * SCENARIO: With a buy-and-hold strategy, verify that the equity curve
   * values at each bar only reflect prices up to that bar.
   * Specifically, verify the equity at bar T equals:
   *   cash + position * bars[T].close
   * This proves no future prices leaked into equity calculations.
   */
  it('equity at each bar reflects only historical data', () => {
    class BuyAtBar0Strategy implements Strategy {
      readonly config: StrategyConfig = {
        id: 'buy-bar0',
        name: 'Buy Bar 0',
        description: 'Buys at bar 0',
        parameters: [],
      };
      initialize() {}
      onBar(ctx: StrategyContext): Signal {
        if (ctx.currentIndex === 0) return { action: 'BUY', quantity: 50 };
        return { action: 'HOLD' };
      }
      finalize() {}
    }

    const closes = [100, 110, 120, 90, 130, 80, 140, 70, 150, 60];
    const opens = closes.map((c) => c);
    const dates = makeDates(10);
    const bars = createBars(dates, opens, closes);

    const engine = new BacktestEngine(defaultConfig());
    const result = engine.run(bars, new BuyAtBar0Strategy());

    const buyTrade = result.trades.find((t) => t.side === 'BUY');
    expect(buyTrade).toBeDefined();
    // Buy signal at bar 0, executes at bar 1's open = 110
    // quantity = min(50, floor(10000/110)) = min(50, 90) = 50
    // cost = 50 * 110 = 5500, cash = 4500, position = 50

    for (const point of result.equityCurve) {
      const idx = bars.findIndex(
        (b) => b.timestamp.getTime() === point.timestamp.getTime()
      );
      // equity = cash + position * close at that bar
      const expectedEquity = point.cash + point.position_value;
      expect(point.equity).toBeCloseTo(expectedEquity, 2);

      // After trade execution (idx >= 1), position_value should equal quantity * close
      if (idx >= 1 && buyTrade) {
        const barClose = bars[idx]!.close;
        expect(point.position_value).toBeCloseTo(buyTrade.quantity * barClose, 0);
      }
    }
  });
});
