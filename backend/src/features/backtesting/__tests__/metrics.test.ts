import { describe, it, expect } from 'vitest';
import { MetricsEngine } from '../metrics/metrics.engine';
import { BacktestEquityPoint, BacktestTrade } from '../types';
import { v4 as uuidv4 } from 'uuid';

function createEquityPoint(equity: number, dailyReturn: number | null = null, drawdown: number | null = null): BacktestEquityPoint {
  return {
    id: uuidv4(),
    backtest_id: 'test',
    timestamp: new Date(),
    equity,
    cash: equity,
    position_value: 0,
    daily_return: dailyReturn,
    drawdown,
    created_at: new Date(),
  };
}

function createTrade(side: 'BUY' | 'SELL', pnl: number | null): BacktestTrade {
  return {
    id: uuidv4(),
    backtest_id: 'test',
    timestamp: new Date(),
    side,
    quantity: 10,
    price: 100,
    execution_price: 100,
    commission: 0,
    slippage_amount: 0,
    pnl,
    created_at: new Date(),
  };
}

describe('MetricsEngine', () => {
  const engine = new MetricsEngine();

  it('should return null metrics for empty equity curve', () => {
    const result = engine.calculate({
      equityCurve: [],
      trades: [],
      initialCapital: 10000,
    });

    expect(result.total_return).toBeNull();
    expect(result.annualized_return).toBeNull();
    expect(result.volatility).toBeNull();
    expect(result.sharpe_ratio).toBeNull();
    expect(result.sortino_ratio).toBeNull();
    expect(result.max_drawdown).toBeNull();
    expect(result.calmar_ratio).toBeNull();
    expect(result.win_rate).toBeNull();
    expect(result.profit_factor).toBeNull();
    expect(result.total_trades).toBeNull();
  });

  it('should calculate total return', () => {
    const equityCurve = [
      createEquityPoint(10000, 0, 0),
      createEquityPoint(11000, 0.1, 0),
    ];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    expect(result.total_return).toBeCloseTo(0.1, 5);
  });

  it('should calculate negative total return', () => {
    const equityCurve = [
      createEquityPoint(10000, 0, 0),
      createEquityPoint(9000, -0.1, 0.1),
    ];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    expect(result.total_return).toBeCloseTo(-0.1, 5);
  });

  it('should calculate CAGR', () => {
    const equityCurve = [
      createEquityPoint(10000, 0, 0),
      createEquityPoint(11000, 0.1, 0),
    ];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    // CAGR for 2 days: (11000/10000)^(252/2) - 1
    const expected = Math.pow(11000 / 10000, 252 / 2) - 1;
    expect(result.annualized_return).toBeCloseTo(expected, 5);
  });

  it('should calculate volatility', () => {
    const dailyReturns = [0.01, -0.02, 0.015, -0.01, 0.005];
    const equityCurve = dailyReturns.map((r, i) => {
      const prev = i === 0 ? 10000 : 10000 * (1 + dailyReturns[i - 1]!);
      return createEquityPoint(prev * (1 + r), r, 0);
    });
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    expect(result.volatility).toBeGreaterThan(0);
  });

  it('should calculate Sharpe ratio', () => {
    const equityCurve = [
      createEquityPoint(10000, 0, 0),
      createEquityPoint(10100, 0.01, 0),
      createEquityPoint(10200, 0.0099, 0),
      createEquityPoint(10300, 0.0098, 0),
    ];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    expect(result.sharpe_ratio).toBeGreaterThan(0);
  });

  it('should calculate Sortino ratio', () => {
    const equityCurve = [
      createEquityPoint(10000, 0, 0),
      createEquityPoint(10100, 0.01, 0),
      createEquityPoint(9900, -0.0198, 0),
      createEquityPoint(10100, 0.0202, 0),
    ];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    expect(result.sortino_ratio).toBeGreaterThan(0);
  });

  it('should return null Sharpe when std dev is 0', () => {
    const equityCurve = [
      createEquityPoint(10000, 0, 0),
      createEquityPoint(10000, 0, 0),
      createEquityPoint(10000, 0, 0),
    ];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    expect(result.sharpe_ratio).toBeNull();
  });

  it('should calculate maximum drawdown', () => {
    const equityCurve = [
      createEquityPoint(10000, 0, 0),
      createEquityPoint(11000, 0.1, 0),
      createEquityPoint(9900, -0.1, 0.1),
      createEquityPoint(10500, 0.0606, 0),
    ];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    // Max drawdown from 11000 to 9900 = (11000-9900)/11000 = 0.1
    expect(result.max_drawdown).toBeCloseTo(0.1, 5);
  });

  it('should calculate Calmar ratio', () => {
    const equityCurve = [
      createEquityPoint(10000, 0, 0),
      createEquityPoint(11000, 0.1, 0),
      createEquityPoint(10500, -0.0455, 0.0455),
      createEquityPoint(12000, 0.1429, 0),
    ];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    expect(result.calmar_ratio).toBeGreaterThan(0);
  });

  it('should calculate win rate', () => {
    const trades = [
      createTrade('SELL', 100),
      createTrade('SELL', -50),
      createTrade('SELL', 200),
      createTrade('SELL', -30),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.win_rate).toBeCloseTo(0.5, 5);
    expect(result.total_trades).toBe(4);
    expect(result.winning_trades).toBe(2);
    expect(result.losing_trades).toBe(2);
  });

  it('should calculate profit factor', () => {
    const trades = [
      createTrade('SELL', 200),
      createTrade('SELL', -100),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.profit_factor).toBeCloseTo(2, 5);
  });

  it('should return null profit factor when no losing trades', () => {
    const trades = [
      createTrade('SELL', 100),
      createTrade('SELL', 200),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.profit_factor).toBeNull();
  });

  it('should calculate average winning trade', () => {
    const trades = [
      createTrade('SELL', 100),
      createTrade('SELL', -50),
      createTrade('SELL', 300),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.avg_winning_trade).toBeCloseTo(200, 5);
  });

  it('should calculate average losing trade', () => {
    const trades = [
      createTrade('SELL', 100),
      createTrade('SELL', -50),
      createTrade('SELL', -150),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.avg_losing_trade).toBeCloseTo(-100, 5);
  });

  it('should calculate largest winning and losing trades', () => {
    const trades = [
      createTrade('SELL', 100),
      createTrade('SELL', -50),
      createTrade('SELL', 300),
      createTrade('SELL', -200),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.largest_winning_trade).toBe(300);
    expect(result.largest_losing_trade).toBe(-200);
  });

  it('should calculate average trade', () => {
    const trades = [
      createTrade('SELL', 100),
      createTrade('SELL', -50),
      createTrade('SELL', 200),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.avg_trade).toBeCloseTo(83.333, 2);
  });

  it('should handle no trades', () => {
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades: [], initialCapital: 10000 });
    expect(result.total_trades).toBeNull();
    expect(result.winning_trades).toBeNull();
    expect(result.losing_trades).toBeNull();
    expect(result.win_rate).toBeNull();
    expect(result.profit_factor).toBeNull();
  });

  it('should handle all winning trades', () => {
    const trades = [
      createTrade('SELL', 100),
      createTrade('SELL', 200),
      createTrade('SELL', 300),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.win_rate).toBe(1);
    expect(result.profit_factor).toBeNull(); // no losing trades
    expect(result.losing_trades).toBeNull(); // 0 || null = null per MetricsEngine
  });

  it('should handle all losing trades', () => {
    const trades = [
      createTrade('SELL', -100),
      createTrade('SELL', -200),
      createTrade('SELL', -300),
    ];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.win_rate).toBe(0);
    expect(result.winning_trades).toBeNull(); // 0 || null = null per MetricsEngine
    expect(result.losing_trades).toBe(3);
  });

  it('should handle single trade', () => {
    const trades = [createTrade('SELL', 150)];
    const equityCurve = [createEquityPoint(10000, 0, 0)];
    const result = engine.calculate({ equityCurve, trades, initialCapital: 10000 });
    expect(result.total_trades).toBe(1);
    expect(result.winning_trades).toBe(1);
    expect(result.avg_winning_trade).toBe(150);
    expect(result.largest_winning_trade).toBe(150);
  });
});
