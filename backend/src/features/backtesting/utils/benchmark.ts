import { MarketBar, BenchmarkResult } from '../types';

/**
 * BenchmarkCalculator - Calculates Buy & Hold benchmark performance.
 *
 * Buys at first bar's open price with all capital.
 * Holds until last bar.
 * Sells at last bar's close price.
 */
export class BenchmarkCalculator {
  private initialCapital: number;

  constructor(initialCapital: number) {
    this.initialCapital = initialCapital;
  }

  calculate(bars: MarketBar[]): BenchmarkResult {
    if (bars.length === 0) {
      return {
        total_return: 0,
        annualized_return: 0,
        max_drawdown: 0,
        volatility: 0,
        final_equity: this.initialCapital,
      };
    }

    if (bars.length === 1) {
      const firstBar = bars[0]!;
      const openPrice = firstBar.open;
      const closePrice = firstBar.close;
      const shares = this.initialCapital / openPrice;
      const finalEquity = shares * closePrice;

      return {
        total_return: (finalEquity - this.initialCapital) / this.initialCapital,
        annualized_return: 0,
        max_drawdown: 0,
        volatility: 0,
        final_equity: finalEquity,
      };
    }

    const firstBar = bars[0]!;
    const lastBar = bars[bars.length - 1]!;

    // Buy at first bar's open
    const entryPrice = firstBar.open;
    const shares = this.initialCapital / entryPrice;

    // Track equity over time for drawdown and volatility
    const equityCurve: number[] = [];
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i]!;
      equityCurve.push(shares * bar.close);
    }

    // Final equity at last bar's close
    const finalEquity = shares * lastBar.close;

    // Total return
    const totalReturn = (finalEquity - this.initialCapital) / this.initialCapital;

    // Annualized return (CAGR)
    const tradingDays = bars.length;
    const annualizedReturn = Math.pow(finalEquity / this.initialCapital, 252 / tradingDays) - 1;

    // Maximum drawdown
    let peak = equityCurve[0]!;
    let maxDrawdown = 0;
    for (let i = 0; i < equityCurve.length; i++) {
      const eq = equityCurve[i]!;
      if (eq > peak) {
        peak = eq;
      }
      if (peak > 0) {
        const drawdown = (peak - eq) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    // Volatility of daily returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prev = equityCurve[i - 1]!;
      const curr = equityCurve[i]!;
      if (prev > 0) {
        dailyReturns.push((curr - prev) / prev);
      }
    }

    let volatility = 0;
    if (dailyReturns.length > 0) {
      const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((sum, r) => sum + (r - mean) * (r - mean), 0) / dailyReturns.length;
      volatility = Math.sqrt(variance) * Math.sqrt(252);
    }

    return {
      total_return: totalReturn,
      annualized_return: annualizedReturn,
      max_drawdown: maxDrawdown,
      volatility,
      final_equity: finalEquity,
    };
  }
}
