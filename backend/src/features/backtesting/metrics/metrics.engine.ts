import {
  BacktestEquityPoint,
  BacktestTrade,
  BacktestMetrics,
} from '../types';

type MetricValue = number | null;

interface MetricsInput {
  equityCurve: BacktestEquityPoint[];
  trades: BacktestTrade[];
  initialCapital: number;
}

/**
 * MetricsEngine - Calculates performance metrics from equity curve and trades.
 *
 * Uses population standard deviation for volatility calculations.
 * Returns null for metrics that cannot be calculated (division by zero, insufficient data).
 */
export class MetricsEngine {
  calculate(input: MetricsInput): Omit<BacktestMetrics, 'id' | 'backtest_id' | 'created_at'> {
    const { equityCurve, trades, initialCapital } = input;

    if (equityCurve.length === 0) {
      return this.emptyMetrics();
    }

    const finalEquity = equityCurve[equityCurve.length - 1]!.equity;
    const tradingDays = equityCurve.length;

    // Total return
    const totalReturn = initialCapital > 0
      ? (finalEquity - initialCapital) / initialCapital
      : null;

    // Annualized return (CAGR)
    const annualizedReturn = initialCapital > 0 && tradingDays > 0
      ? Math.pow(finalEquity / initialCapital, 252 / tradingDays) - 1
      : null;

    // Daily returns from equity curve
    const dailyReturns = equityCurve
      .map((ep) => ep.daily_return)
      .filter((r): r is number => r !== null);

    // Volatility: population std dev of daily returns * sqrt(252)
    const volatility = this.calculateVolatility(dailyReturns);

    // Sharpe ratio (risk-free rate = 0)
    const meanReturn = dailyReturns.length > 0
      ? dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length
      : 0;
    const stdReturn = this.calculatePopStdDev(dailyReturns, meanReturn);
    const sharpeRatio = stdReturn > 0
      ? (meanReturn / stdReturn) * Math.sqrt(252)
      : null;

    // Sortino ratio (downside deviation)
    const downsideReturns = dailyReturns.filter((r) => r < 0);
    const downsideVariance = downsideReturns.length > 0
      ? downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length
      : 0;
    const downsideStd = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideStd > 0
      ? (meanReturn / downsideStd) * Math.sqrt(252)
      : null;

    // Maximum drawdown
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve);

    // Calmar ratio
    const calmarRatio = maxDrawdown > 0 && annualizedReturn !== null
      ? annualizedReturn / maxDrawdown
      : null;

    // Trade statistics
    const sellTrades = trades.filter((t) => t.side === 'SELL');
    const totalTrades = sellTrades.length;

    const pnlValues = sellTrades
      .map((t) => t.pnl)
      .filter((p): p is number => p !== null);

    const winningPnl = pnlValues.filter((p) => p > 0);
    const losingPnl = pnlValues.filter((p) => p < 0);

    const winRate = totalTrades > 0 ? winningPnl.length / totalTrades : null;

    const totalWinningPnl = winningPnl.reduce((sum, p) => sum + p, 0);
    const totalLosingPnl = losingPnl.reduce((sum, p) => sum + p, 0);
    const profitFactor = totalLosingPnl !== 0
      ? totalWinningPnl / Math.abs(totalLosingPnl)
      : null;

    const avgWinningTrade = winningPnl.length > 0
      ? totalWinningPnl / winningPnl.length
      : null;
    const avgLosingTrade = losingPnl.length > 0
      ? totalLosingPnl / losingPnl.length
      : null;
    const largestWinningTrade = winningPnl.length > 0 ? Math.max(...winningPnl) : null;
    const largestLosingTrade = losingPnl.length > 0 ? Math.min(...losingPnl) : null;
    const avgTrade = pnlValues.length > 0
      ? pnlValues.reduce((sum, p) => sum + p, 0) / pnlValues.length
      : null;

    return {
      total_return: totalReturn,
      annualized_return: annualizedReturn,
      volatility,
      sharpe_ratio: sharpeRatio,
      sortino_ratio: sortinoRatio,
      max_drawdown: maxDrawdown,
      calmar_ratio: calmarRatio,
      win_rate: winRate,
      profit_factor: profitFactor,
      total_trades: totalTrades || null,
      winning_trades: winningPnl.length || null,
      losing_trades: losingPnl.length || null,
      avg_winning_trade: avgWinningTrade,
      avg_losing_trade: avgLosingTrade,
      largest_winning_trade: largestWinningTrade,
      largest_losing_trade: largestLosingTrade,
      avg_trade: avgTrade,
    };
  }

  private calculateVolatility(returns: number[]): MetricValue {
    if (returns.length === 0) return null;
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - mean) * (r - mean), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  private calculatePopStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateMaxDrawdown(equityCurve: BacktestEquityPoint[]): number {
    if (equityCurve.length === 0) return 0;

    let peak = equityCurve[0]!.equity;
    let maxDrawdown = 0;

    for (let i = 0; i < equityCurve.length; i++) {
      const equity = equityCurve[i]!.equity;
      if (equity > peak) {
        peak = equity;
      }
      if (peak > 0) {
        const drawdown = (peak - equity) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    return maxDrawdown;
  }

  private emptyMetrics(): Omit<BacktestMetrics, 'id' | 'backtest_id' | 'created_at'> {
    return {
      total_return: null,
      annualized_return: null,
      volatility: null,
      sharpe_ratio: null,
      sortino_ratio: null,
      max_drawdown: null,
      calmar_ratio: null,
      win_rate: null,
      profit_factor: null,
      total_trades: null,
      winning_trades: null,
      losing_trades: null,
      avg_winning_trade: null,
      avg_losing_trade: null,
      largest_winning_trade: null,
      largest_losing_trade: null,
      avg_trade: null,
    };
  }
}
