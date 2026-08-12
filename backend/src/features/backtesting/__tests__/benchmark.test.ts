import { describe, it, expect } from 'vitest';
import { BenchmarkCalculator } from '../utils/benchmark';
import { MarketBar } from '../types';

function createBar(date: string, open: number, high: number, low: number, close: number): MarketBar {
  return { timestamp: new Date(date), open, high, low, close, volume: 1000 };
}

function createBars(dates: string[], opens: number[], closes: number[]): MarketBar[] {
  return dates.map((date, i) => {
    const open = opens[i]!;
    const close = closes[i]!;
    return createBar(date, open, Math.max(open, close) + 2, Math.min(open, close) - 2, close);
  });
}

describe('BenchmarkCalculator', () => {
  it('should buy at first bar open and sell at last bar close', () => {
    const bars = createBars(
      ['2024-01-01', '2024-01-02', '2024-01-03'],
      [100, 105, 110],
      [105, 110, 115],
    );
    const calc = new BenchmarkCalculator(10000);
    const result = calc.calculate(bars);

    // Buy at 100, sell at 115
    const shares = 10000 / 100;
    const finalEquity = shares * 115;
    expect(result.final_equity).toBeCloseTo(finalEquity, 2);
    expect(result.total_return).toBeCloseTo((finalEquity - 10000) / 10000, 5);
  });

  it('should calculate correct return for single bar', () => {
    const bars = createBars(['2024-01-01'], [100], [110]);
    const calc = new BenchmarkCalculator(10000);
    const result = calc.calculate(bars);

    const shares = 10000 / 100;
    const finalEquity = shares * 110;
    expect(result.final_equity).toBeCloseTo(finalEquity, 2);
    expect(result.total_return).toBeCloseTo(0.1, 5);
    expect(result.annualized_return).toBe(0);
  });

  it('should calculate correct max drawdown', () => {
    const bars = createBars(
      ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'],
      [100, 120, 90, 110],
      [120, 90, 110, 130],
    );
    const calc = new BenchmarkCalculator(10000);
    const result = calc.calculate(bars);

    const shares = 10000 / 100;
    // Equity curve: 12000, 9000, 11000, 13000
    // Peak = 12000, trough = 9000
    // Drawdown = (12000 - 9000) / 12000 = 0.25
    expect(result.max_drawdown).toBeCloseTo(0.25, 5);
  });

  it('should handle empty bars', () => {
    const calc = new BenchmarkCalculator(10000);
    const result = calc.calculate([]);
    expect(result.total_return).toBe(0);
    expect(result.annualized_return).toBe(0);
    expect(result.max_drawdown).toBe(0);
    expect(result.volatility).toBe(0);
    expect(result.final_equity).toBe(10000);
  });

  it('should handle flat market (no price change)', () => {
    const bars = createBars(
      ['2024-01-01', '2024-01-02', '2024-01-03'],
      [100, 100, 100],
      [100, 100, 100],
    );
    const calc = new BenchmarkCalculator(10000);
    const result = calc.calculate(bars);

    expect(result.total_return).toBe(0);
    expect(result.max_drawdown).toBe(0);
    expect(result.volatility).toBe(0);
    expect(result.final_equity).toBe(10000);
  });

  it('should calculate annualized return correctly', () => {
    const bars = createBars(
      ['2024-01-01', '2024-01-02'],
      [100, 100],
      [100, 110],
    );
    const calc = new BenchmarkCalculator(10000);
    const result = calc.calculate(bars);

    const expected = Math.pow(11000 / 10000, 252 / 2) - 1;
    expect(result.annualized_return).toBeCloseTo(expected, 5);
  });

  it('should calculate volatility correctly', () => {
    const bars = createBars(
      ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'],
      [100, 100, 100, 100],
      [100, 110, 100, 110],
    );
    const calc = new BenchmarkCalculator(10000);
    const result = calc.calculate(bars);

    expect(result.volatility).toBeGreaterThan(0);
  });
});
