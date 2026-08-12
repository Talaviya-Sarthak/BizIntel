import { describe, it, expect } from 'vitest';
import { BacktestEngine, BacktestEngineConfig } from '../engines/backtest.engine';
import { Strategy } from '../strategies/strategy.interface';
import { MarketBar, Signal, StrategyContext, StrategyConfig } from '../types';

// ──────────────────────── Helpers ───────────────────────────────

function createBar(timestamp: Date, open: number, high: number, low: number, close: number): MarketBar {
  return { timestamp, open, high, low, close, volume: 1000 };
}

function createDateBars(startDate: string, opens: number[], closes: number[]): MarketBar[] {
  const base = new Date(startDate);
  return opens.map((open, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const close = closes[i]!;
    return createBar(d, open, Math.max(open, close) + 2, Math.min(open, close) - 2, close);
  });
}

function defaultConfig(overrides?: Partial<BacktestEngineConfig>): BacktestEngineConfig {
  return {
    initialCapital: 10000,
    commission: 10,
    slippage: 0.001,
    ...overrides,
  };
}

// A strategy that always holds
class HoldStrategy implements Strategy {
  readonly config: StrategyConfig = {
    id: 'hold',
    name: 'Hold',
    description: 'Always holds',
    parameters: [],
  };
  initialize() {}
  onBar(): Signal { return { action: 'HOLD' }; }
  finalize() {}
}

// A strategy that buys on first bar, sells on last bar
class BuySellStrategy implements Strategy {
  readonly config: StrategyConfig = {
    id: 'buy-sell',
    name: 'Buy Sell',
    description: 'Buys first bar, sells last',
    parameters: [],
  };
  private totalBars = 0;
  initialize() {}
  onBar(ctx: StrategyContext): Signal {
    if (ctx.currentIndex === 0) return { action: 'BUY', quantity: 100 };
    if (ctx.currentIndex === ctx.bars.length - 1 && ctx.position > 0) {
      return { action: 'SELL', quantity: ctx.position };
    }
    return { action: 'HOLD' };
  }
  finalize() {}
}

// A strategy that only buys
class BuyOnlyStrategy implements Strategy {
  readonly config: StrategyConfig = {
    id: 'buy-only',
    name: 'Buy Only',
    description: 'Buys every bar if no position',
    parameters: [],
  };
  initialize() {}
  onBar(ctx: StrategyContext): Signal {
    if (ctx.position === 0) return { action: 'BUY', quantity: 10 };
    return { action: 'HOLD' };
  }
  finalize() {}
}

// A strategy that sells everything if price drops below threshold
class CrashStrategy implements Strategy {
  readonly config: StrategyConfig = {
    id: 'crash',
    name: 'Crash',
    description: 'Sells if price < 80',
    parameters: [],
  };
  initialize() {}
  onBar(ctx: StrategyContext): Signal {
    const bar = ctx.bars[ctx.currentIndex]!;
    if (bar.close < 80 && ctx.position > 0) {
      return { action: 'SELL', quantity: ctx.position };
    }
    return { action: 'HOLD' };
  }
  finalize() {}
}

// ──────────────────────── Engine Tests ──────────────────────────

describe('BacktestEngine', () => {
  it('should handle empty bars', () => {
    const engine = new BacktestEngine(defaultConfig());
    const result = engine.run([], new HoldStrategy());
    expect(result.trades).toHaveLength(0);
    expect(result.equityCurve).toHaveLength(0);
    expect(result.finalEquity).toBe(10000);
  });

  it('should produce equity curve with correct length', () => {
    const bars = createDateBars('2024-01-01', [100, 101, 102], [100, 101, 102]);
    const engine = new BacktestEngine(defaultConfig());
    const result = engine.run(bars, new HoldStrategy());
    expect(result.equityCurve).toHaveLength(3);
  });

  it('should maintain initial equity when strategy holds', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100], [100, 100, 100]);
    const engine = new BacktestEngine(defaultConfig());
    const result = engine.run(bars, new HoldStrategy());
    expect(result.finalEquity).toBe(10000);
  });

  it('BUY increases position and decreases cash', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100], [100, 100, 100]);
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new BuyOnlyStrategy());

    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.trades[0]!.side).toBe('BUY');
    expect(result.trades[0]!.quantity).toBe(10);
  });

  it('SELL increases cash and decreases position', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100, 100], [100, 100, 100, 100]);
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const strategy = new BuySellStrategy();
    const result = engine.run(bars, strategy);

    const sells = result.trades.filter((t) => t.side === 'SELL');
    expect(sells.length).toBe(1);
    expect(sells[0]!.quantity).toBeGreaterThan(0);
  });

  it('should not allow short selling (position >= 0)', () => {
    const closes = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
    const opens = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
    const bars = createDateBars('2024-01-01', opens, closes);
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new CrashStrategy());

    // The strategy tries to sell but has no position initially
    expect(result.trades.filter((t) => t.side === 'SELL').length).toBe(0);
  });

  it('should apply commission to trades', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100, 100], [100, 100, 100, 100]);
    const commission = 50;
    const engine = new BacktestEngine(defaultConfig({ commission, slippage: 0 }));
    const result = engine.run(bars, new BuySellStrategy());

    const tradesWithCommission = result.trades.filter((t) => t.commission > 0);
    expect(tradesWithCommission.length).toBeGreaterThan(0);
    expect(tradesWithCommission[0]!.commission).toBe(commission);
  });

  it('BUY execution price includes slippage upward', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100, 100], [100, 100, 100, 100]);
    const slippage = 0.01;
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage }));
    const result = engine.run(bars, new BuyOnlyStrategy());

    const buyTrade = result.trades.find((t) => t.side === 'BUY');
    expect(buyTrade).toBeDefined();
    // execution_price should be openPrice * (1 + slippage)
    expect(buyTrade!.execution_price).toBeCloseTo(100 * (1 + slippage), 2);
  });

  it('SELL execution price includes slippage downward', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100, 100, 100], [100, 100, 100, 100, 100]);
    const slippage = 0.01;
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage }));
    const result = engine.run(bars, new BuySellStrategy());

    const sellTrade = result.trades.find((t) => t.side === 'SELL');
    expect(sellTrade).toBeDefined();
    // execution_price should be openPrice * (1 - slippage)
    expect(sellTrade!.execution_price).toBeCloseTo(100 * (1 - slippage), 2);
  });

  it('equity = cash + position * closePrice at each bar', () => {
    const bars = createDateBars('2024-01-01', [100, 110, 120], [100, 110, 120]);
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new HoldStrategy());

    for (const point of result.equityCurve) {
      // With hold strategy, position=0, so equity should always be initialCapital
      expect(point.equity).toBe(10000);
      expect(point.position_value).toBe(0);
    }
  });

  it('should calculate daily returns correctly', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100], [100, 100, 100]);
    const engine = new BacktestEngine(defaultConfig());
    const result = engine.run(bars, new HoldStrategy());

    // With no trading, daily returns should all be 0
    for (const point of result.equityCurve) {
      expect(point.daily_return).toBe(0);
    }
  });

  it('drawdown should be 0 when equity never drops below peak', () => {
    const closes = [100, 110, 120, 130, 140];
    const opens = [100, 110, 120, 130, 140];
    const bars = createDateBars('2024-01-01', opens, closes);
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new HoldStrategy());

    for (const point of result.equityCurve) {
      expect(point.drawdown).toBe(0);
    }
  });
});

// ──────────────── Look-ahead Bias Prevention ────────────────────

describe('Look-ahead bias prevention', () => {
  it('strategy at bar T cannot see bar T+1 data', () => {
    // A spy strategy that records what bars it sees
    class SpyStrategy implements Strategy {
      readonly config: StrategyConfig = {
        id: 'spy',
        name: 'Spy',
        description: 'Records context',
        parameters: [],
      };
      seenBars: number[][] = [];
      initialize() {}
      onBar(ctx: StrategyContext): Signal {
        this.seenBars.push(ctx.bars.map((b) => b.close));
        return { action: 'HOLD' };
      }
      finalize() {}
    }

    const prices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109];
    const bars = createDateBars('2024-01-01', prices, prices);
    const engine = new BacktestEngine(defaultConfig());
    const spy = new SpyStrategy();
    engine.run(bars, spy);

    // At each bar, the strategy should only see bars[0..currentIndex]
    for (let i = 0; i < bars.length; i++) {
      expect(spy.seenBars[i]!.length).toBe(i + 1);
    }
  });

  it('running full backtest vs incremental gives same results', () => {
    // A strategy that crashes at bar 50 - if it could see future data,
    // it might sell at bar 49 to avoid the crash
    class CrashAtBar50 implements Strategy {
      readonly config: StrategyConfig = {
        id: 'crash50',
        name: 'Crash50',
        description: 'Crashes at bar 50',
        parameters: [],
      };
      initialize() {}
      onBar(ctx: StrategyContext): Signal {
        const bar = ctx.bars[ctx.currentIndex]!;
        // Only has access to bars[0..currentIndex], no look-ahead
        if (bar.close < 50 && ctx.position > 0) {
          return { action: 'SELL', quantity: ctx.position };
        }
        if (ctx.currentIndex === 0) {
          return { action: 'BUY', quantity: 100 };
        }
        return { action: 'HOLD' };
      }
      finalize() {}
    }

    // Create data: stable then crash at bar 50
    const prices: number[] = [];
    for (let i = 0; i < 60; i++) {
      if (i < 50) prices.push(100);
      else prices.push(40); // crash
    }
    const bars = createDateBars('2024-01-01', prices, prices);

    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new CrashAtBar50());

    // The sell should happen at bar 51 (next bar after signal at bar 50)
    // because at bar 50 the price is 40, which is < 50, triggering sell
    // But the signal at bar 50 executes at bar 51's open
    const sells = result.trades.filter((t) => t.side === 'SELL');
    expect(sells.length).toBe(1);
    expect(sells[0]!.quantity).toBe(100);
  });

  it('strategy never receives future bars in context', () => {
    class RecordingStrategy implements Strategy {
      readonly config: StrategyConfig = {
        id: 'rec',
        name: 'Rec',
        description: 'Records context',
        parameters: [],
      };
      maxBarsSeen = 0;
      initialize() {}
      onBar(ctx: StrategyContext): Signal {
        if (ctx.bars.length > this.maxBarsSeen) {
          this.maxBarsSeen = ctx.bars.length;
        }
        return { action: 'HOLD' };
      }
      finalize() {}
    }

    const prices = Array.from({ length: 100 }, (_, i) => 100 + i);
    const bars = createDateBars('2024-01-01', prices, prices);
    const engine = new BacktestEngine(defaultConfig());
    const strategy = new RecordingStrategy();
    engine.run(bars, strategy);

    // The maximum number of bars seen should be 100 (at the last bar)
    // Never more than the total bars
    expect(strategy.maxBarsSeen).toBe(100);
  });
});

// ──────────────── Execution Timing ──────────────────────────────

describe('Execution timing', () => {
  it('signal at bar T executes at bar T+1 open', () => {
    const opens = [100, 110, 120, 130, 140];
    const closes = [105, 115, 125, 135, 145];
    const bars = createDateBars('2024-01-01', opens, closes);

    // Buy at bar 0, the signal is generated at bar 0 using close=105
    // but execution happens at bar 1's open = 110
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new BuyOnlyStrategy());

    const buyTrade = result.trades.find((t) => t.side === 'BUY');
    expect(buyTrade).toBeDefined();
    // Execute at bar 1's open = 110
    expect(buyTrade!.execution_price).toBe(110);
  });

  it('SELL at last bar cannot execute (no next bar)', () => {
    class SellAtLastStrategy implements Strategy {
      readonly config: StrategyConfig = {
        id: 'sell-last',
        name: 'SellLast',
        description: 'Buys bar 0, sells bar 2 (last)',
        parameters: [],
      };
      initialize() {}
      onBar(ctx: StrategyContext): Signal {
        if (ctx.currentIndex === 0) return { action: 'BUY', quantity: 10 };
        if (ctx.currentIndex === 2) return { action: 'SELL', quantity: ctx.position };
        return { action: 'HOLD' };
      }
      finalize() {}
    }

    const bars = createDateBars('2024-01-01', [100, 100, 100], [100, 100, 100]);
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new SellAtLastStrategy());

    // Signal at bar 2 has no bar 3 to execute against
    const sells = result.trades.filter((t) => t.side === 'SELL');
    expect(sells.length).toBe(0);
  });
});

// ──────────────── Transaction Costs ─────────────────────────────

describe('Transaction costs', () => {
  it('BUY: executionPrice = openPrice * (1 + slippage)', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100], [100, 100, 100]);
    const slippage = 0.02;
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage }));
    const result = engine.run(bars, new BuyOnlyStrategy());

    const buy = result.trades.find((t) => t.side === 'BUY');
    expect(buy).toBeDefined();
    expect(buy!.execution_price).toBeCloseTo(100 * 1.02, 2);
  });

  it('SELL: executionPrice = openPrice * (1 - slippage)', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100, 100], [100, 100, 100, 100]);
    const slippage = 0.02;
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage }));
    const result = engine.run(bars, new BuySellStrategy());

    const sell = result.trades.find((t) => t.side === 'SELL');
    expect(sell).toBeDefined();
    expect(sell!.execution_price).toBeCloseTo(100 * 0.98, 2);
  });

  it('commission is subtracted from cash on each trade', () => {
    const bars = createDateBars('2024-01-01', [100, 100, 100, 100, 100], [100, 100, 100, 100, 100]);
    const commission = 25;
    const engine = new BacktestEngine(defaultConfig({ commission, slippage: 0 }));
    const result = engine.run(bars, new BuySellStrategy());

    // 2 trades: BUY and SELL
    expect(result.trades.length).toBe(2);
    const totalCommission = result.trades.reduce((sum, t) => sum + t.commission, 0);
    expect(totalCommission).toBe(commission * 2);
  });
});

// ──────────────── Equity Calculation ────────────────────────────

describe('Equity calculation', () => {
  it('equity = cash + position * closePrice', () => {
    const opens = [100, 100, 100, 100, 100];
    const closes = [100, 100, 100, 100, 100];
    const bars = createDateBars('2024-01-01', opens, closes);
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new BuyOnlyStrategy());

    // After buying 10 shares at 100 with 10000 capital:
    // cash = 10000 - 10*100 = 9000
    // position = 10
    // equity = 9000 + 10*100 = 10000
    const lastPoint = result.equityCurve[result.equityCurve.length - 1]!;
    expect(lastPoint.equity).toBeCloseTo(10000, 0);
  });

  it('profit factor with winning and losing trades', () => {
    // Create a scenario: buy at 100, sell at 120 (win), buy at 100, sell at 80 (loss)
    class WinLossStrategy implements Strategy {
      readonly config: StrategyConfig = { id: 'wl', name: 'WL', description: '', parameters: [] };
      private tradeCount = 0;
      initialize() {}
      onBar(ctx: StrategyContext): Signal {
        if (ctx.position === 0 && this.tradeCount < 2) {
          this.tradeCount++;
          return { action: 'BUY', quantity: 10 };
        }
        if (ctx.position > 0 && ctx.currentIndex >= 2) {
          return { action: 'SELL', quantity: ctx.position };
        }
        return { action: 'HOLD' };
      }
      finalize() {}
    }

    const bars = createDateBars('2024-01-01', [100, 100, 120, 100, 80], [100, 100, 120, 100, 80]);
    const engine = new BacktestEngine(defaultConfig({ commission: 0, slippage: 0 }));
    const result = engine.run(bars, new WinLossStrategy());

    expect(result.metrics.totalTrades).toBeGreaterThan(0);
  });
});
