import type { EngineEquityPoint, EngineTrade } from '../engines/backtestEngine';
import type { BenchmarkMetrics, PerformanceMetrics } from '../types';
import { mean, sampleStdDev } from '../utils/money';

const TRADING_DAYS_PER_YEAR = 252;
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

/**
 * Performance metric definitions — every formula is documented:
 *
 *   totalReturn       (finalEquity − initialCapital) / initialCapital
 *   annualizedReturn  (1 + totalReturn)^(252 / tradingDays) − 1
 *   cagr              (finalEquity / initialCapital)^(1 / years) − 1
 *   volatility        stdDev(dailyReturns) × √252
 *   sharpeRatio       (mean(dailyReturns) − rf) / stdDev(dailyReturns) × √252   (rf = 0)
 *   sortinoRatio      mean(dailyReturns) / downsideDeviation × √252
 *   calmarRatio       cagr / maxDrawdown
 *   maxDrawdown       min over t of (equity_t / runningPeak − 1)
 *   winRate           winningTrades / closedTrades
 *   profitFactor      grossProfit / grossLoss
 *   avgWin / avgLoss  grossProfit / #wins   ·   grossLoss / #losses
 */
export function computeMetrics(
  equity: EngineEquityPoint[],
  trades: EngineTrade[],
  initialCapital: number,
): PerformanceMetrics {
  const finalEquity = equity.length > 0 ? equity[equity.length - 1]!.equity : initialCapital;
  const totalReturn = initialCapital > 0 ? finalEquity / initialCapital - 1 : null;

  const dailyReturns = equity
    .map((point) => point.dailyReturn)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const years =
    equity.length >= 2 ? (equity[equity.length - 1]!.timestamp - equity[0]!.timestamp) / MS_PER_YEAR : 0;

  const cagr =
    totalReturn !== null && years > 0 && finalEquity > 0
      ? Math.pow(finalEquity / initialCapital, 1 / years) - 1
      : null;

  const annualizedReturn =
    totalReturn !== null && dailyReturns.length > 0
      ? Math.pow(1 + totalReturn, TRADING_DAYS_PER_YEAR / dailyReturns.length) - 1
      : null;

  const std = sampleStdDev(dailyReturns);
  const volatility = std === null ? null : std * Math.sqrt(TRADING_DAYS_PER_YEAR);

  const meanReturn = mean(dailyReturns);
  const sharpeRatio =
    meanReturn !== null && std !== null && std > 0
      ? (meanReturn / std) * Math.sqrt(TRADING_DAYS_PER_YEAR)
      : null;

  const downside = dailyReturns.filter((value) => value < 0);
  const downsideDeviation = sampleStdDev(downside.length > 1 ? downside : [0, 0]);
  const sortinoRatio =
    meanReturn !== null && downsideDeviation !== null && downsideDeviation > 0
      ? (meanReturn / downsideDeviation) * Math.sqrt(TRADING_DAYS_PER_YEAR)
      : null;

  const maxDrawdown = computeMaxDrawdown(equity);

  const calmarRatio =
    cagr !== null && maxDrawdown !== null && maxDrawdown > 0 ? cagr / maxDrawdown : null;

  const closedTrades = trades.filter((trade) => trade.side === 'SELL' && trade.pnl !== null);
  const pnls = closedTrades.map((trade) => trade.pnl as number);
  const winning = pnls.filter((value) => value > 0);
  const losing = pnls.filter((value) => value < 0);
  const grossProfit = winning.reduce((sum, value) => sum + value, 0);
  const grossLoss = losing.reduce((sum, value) => sum + Math.abs(value), 0);

  const winRate = closedTrades.length > 0 ? winning.length / closedTrades.length : null;
  const profitFactor =
    closedTrades.length > 0 && grossLoss > 0 ? grossProfit / grossLoss : null;

  return {
    totalReturn,
    annualizedReturn,
    cagr,
    volatility,
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    maxDrawdown,
    winRate,
    profitFactor,
    totalTrades: trades.length,
    winningTrades: winning.length,
    losingTrades: losing.length,
    avgWin: winning.length > 0 ? grossProfit / winning.length : null,
    avgLoss: losing.length > 0 ? -(grossLoss / losing.length) : null,
    avgTrade: closedTrades.length > 0 ? pnls.reduce((sum, value) => sum + value, 0) / closedTrades.length : null,
    largestWin: winning.length > 0 ? Math.max(...winning) : null,
    largestLoss: losing.length > 0 ? Math.min(...losing) : null,
  };
}

export function computeMaxDrawdown(equity: EngineEquityPoint[]): number | null {
  let peak = -Infinity;
  let maxDrawdown = 0;
  for (const point of equity) {
    if (point.equity > peak) peak = point.equity;
    const drawdown = peak > 0 ? point.equity / peak - 1 : 0;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }
  return equity.length > 0 ? Math.abs(maxDrawdown) : null;
}

export function computeBenchmarkMetrics(
  benchmarkEquity: EngineEquityPoint[],
  initialCapital: number,
): BenchmarkMetrics {
  const finalEquity =
    benchmarkEquity.length > 0 ? benchmarkEquity[benchmarkEquity.length - 1]!.equity : initialCapital;
  const totalReturn = initialCapital > 0 ? finalEquity / initialCapital - 1 : null;

  const dailyReturns = benchmarkEquity
    .map((point) => point.dailyReturn)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const years =
    benchmarkEquity.length >= 2
      ? (benchmarkEquity[benchmarkEquity.length - 1]!.timestamp - benchmarkEquity[0]!.timestamp) / MS_PER_YEAR
      : 0;

  const cagr =
    totalReturn !== null && years > 0 && finalEquity > 0
      ? Math.pow(finalEquity / initialCapital, 1 / years) - 1
      : null;

  const std = sampleStdDev(dailyReturns);
  const volatility = std === null ? null : std * Math.sqrt(TRADING_DAYS_PER_YEAR);

  return {
    totalReturn,
    cagr,
    volatility,
    maxDrawdown: computeMaxDrawdown(benchmarkEquity),
    finalEquity: benchmarkEquity.length > 0 ? finalEquity : null,
  };
}
