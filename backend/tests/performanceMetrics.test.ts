import { describe, expect, it } from 'vitest';
import { computeBenchmarkMetrics, computeMaxDrawdown, computeMetrics } from '../src/backtesting/metrics/performanceMetrics';
import type { EngineEquityPoint, EngineTrade } from '../src/backtesting/engines/backtestEngine';

const DAY = 86_400_000;

function equity(values: number[], start = 100, stepMs = DAY): EngineEquityPoint[] {
  let previous: number | null = null;
  let peak = start;
  return values.map((value, i) => {
    if (value > peak) peak = value;
    const dailyReturn = previous === null ? null : value / previous - 1;
    previous = value;
    return {
      timestamp: stepMs * i,
      equity: value,
      cash: value,
      positionValue: 0,
      dailyReturn,
      drawdown: value / peak - 1,
    };
  });
}

function trade(pnl: number): EngineTrade {
  return {
    timestamp: DAY,
    side: 'SELL',
    quantity: 1,
    price: 100,
    entryPrice: 90,
    exitPrice: 100,
    commission: 0,
    slippageCost: 0,
    pnl,
  };
}

describe('computeMetrics', () => {
  it('computes total return and CAGR from equity', () => {
    const eq = equity([100, 110, 121], 100, 365 * DAY); // one bar = one year
    const metrics = computeMetrics(eq, [], 100);
    expect(metrics.totalReturn).toBeCloseTo(0.21, 10);
    expect(metrics.cagr).toBeCloseTo(0.1, 3);
  });

  it('returns null metrics when nothing happened', () => {
    const metrics = computeMetrics(equity([100]), [], 100);
    expect(metrics.totalReturn).toBe(0);
    expect(metrics.cagr).toBeNull();
    expect(metrics.volatility).toBeNull();
    expect(metrics.sharpeRatio).toBeNull();
  });

  it('maxDrawdown measures the worst peak-to-trough decline as a positive fraction', () => {
    const eq = equity([100, 120, 90, 110]);
    expect(computeMaxDrawdown(eq)).toBeCloseTo(0.25, 10);
  });

  it('calmarRatio is cagr divided by max drawdown', () => {
    const eq = equity([100, 140, 120, 150, 130]);
    const metrics = computeMetrics(eq, [], 100);
    const expectedCalmar = metrics.cagr! / metrics.maxDrawdown!;
    expect(metrics.calmarRatio).toBeCloseTo(expectedCalmar, 10);
  });

  it('computes win rate, profit factor and trade aggregates', () => {
    const trades = [trade(10), trade(20), trade(-5), trade(-15)];
    const metrics = computeMetrics(equity([100, 105]), trades, 100);
    expect(metrics.totalTrades).toBe(4);
    expect(metrics.winningTrades).toBe(2);
    expect(metrics.losingTrades).toBe(2);
    expect(metrics.winRate).toBe(0.5);
    expect(metrics.profitFactor).toBe(30 / 20);
    expect(metrics.avgWin).toBe(15);
    expect(metrics.avgLoss).toBe(-10);
    expect(metrics.largestWin).toBe(20);
    expect(metrics.largestLoss).toBe(-15);
  });

  it('profitFactor is null when there are no losing trades', () => {
    const metrics = computeMetrics(equity([100, 110]), [trade(5), trade(5)], 100);
    expect(metrics.profitFactor).toBeNull();
  });
});

describe('computeBenchmarkMetrics', () => {
  it('computes the buy & hold benchmark summary', () => {
    const eq = equity([100, 130, 90]);
    const metrics = computeBenchmarkMetrics(eq, 100);
    expect(metrics.totalReturn).toBeCloseTo(-0.1, 10);
    expect(metrics.maxDrawdown).toBeCloseTo(1 - 90 / 130, 10); // peak 130 → trough 90
  });
});
