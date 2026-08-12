import { v4 as uuidv4 } from 'uuid';
import {
  MarketBar,
  Signal,
  BacktestTrade,
  BacktestEquityPoint,
  StrategyContext,
  TradeSide,
} from '../types';
import { Strategy } from '../strategies/strategy.interface';

export interface BacktestEngineConfig {
  initialCapital: number;
  commission: number;
  slippage: number;
}

export interface BacktestEngineMetrics {
  totalReturn: number | null;
  annualizedReturn: number | null;
  volatility: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  maxDrawdown: number | null;
  calmarRatio: number | null;
  winRate: number | null;
  profitFactor: number | null;
  totalTrades: number | null;
  winningTrades: number | null;
  losingTrades: number | null;
  avgWinningTrade: number | null;
  avgLosingTrade: number | null;
  largestWinningTrade: number | null;
  largestLosingTrade: number | null;
  avgTrade: number | null;
}

export interface BacktestEngineResult {
  trades: BacktestTrade[];
  equityCurve: BacktestEquityPoint[];
  finalEquity: number;
  metrics: BacktestEngineMetrics;
}

/**
 * BacktestEngine - Processes market data through a strategy to simulate trading.
 *
 * LOOK-AHEAD BIAS PREVENTION:
 *   The strategy.onBar() method receives only bars[0..currentIndex].
 *   At no point does the strategy have access to future data.
 *   The engine NEVER passes bars beyond currentIndex to the strategy.
 *
 * EXECUTION TIMING MODEL:
 *   A signal generated at bar T uses bar T's close price for the decision.
 *   The order is executed at bar T+1's open price (next-bar execution).
 *   If bar T is the last bar, the signal cannot be executed (no next bar).
 */
export class BacktestEngine {
  private config: BacktestEngineConfig;
  private backtestId: string;

  constructor(config: BacktestEngineConfig, backtestId?: string) {
    this.config = config;
    this.backtestId = backtestId || uuidv4();
  }

  run(bars: MarketBar[], strategy: Strategy): BacktestEngineResult {
    if (bars.length === 0) {
      return this.createEmptyResult();
    }

    strategy.initialize({});

    let cash = this.config.initialCapital;
    let position = 0;
    let equity = this.config.initialCapital;

    const trades: BacktestTrade[] = [];
    const equityPoints: BacktestEquityPoint[] = [];
    const dailyReturns: number[] = [];

    let previousEquity = equity;
    let peakEquity = equity;
    let pendingSignal: { signal: Signal; barIndex: number } | null = null;

    // Process each bar sequentially
    for (let i = 0; i < bars.length; i++) {
      const currentBar = bars[i]!;

      // Execute pending signal from previous bar at current bar's open
      // EXECUTION TIMING: signal from bar T executes at bar T+1 open
      if (pendingSignal) {
        const execResult = this.executeSignal(
          pendingSignal.signal,
          currentBar.open,
          cash,
          position,
          equity
        );

        const tradesPnl = this.calculateTradesPnl(
          pendingSignal.signal,
          currentBar.open,
          execResult.quantity
        );

        const trade = this.createTrade(
          pendingSignal.signal,
          currentBar.open,
          execResult.quantity,
          execResult.executionPrice,
          execResult.commission,
          execResult.slippageAmount,
          tradesPnl,
          currentBar.timestamp
        );

        trades.push(trade);
        cash = execResult.newCash;
        position = execResult.newPosition;

        pendingSignal = null;
      }

      // Build context with bars[0..i] ONLY - prevents look-ahead bias
      const contextBars = bars.slice(0, i + 1);
      const context: StrategyContext = {
        bars: contextBars,
        currentIndex: i,
        position,
        cash,
        equity: cash + position * currentBar.close,
      };

      // Get signal from strategy - strategy only sees bars up to current index
      const signal = strategy.onBar(context);

      // Queue signal for execution at next bar's open
      if (signal.action === 'BUY' && signal.quantity && signal.quantity > 0 && position === 0) {
        pendingSignal = { signal, barIndex: i };
      } else if (signal.action === 'SELL' && signal.quantity && signal.quantity > 0 && position > 0) {
        pendingSignal = { signal, barIndex: i };
      }

      // Update equity using current bar's close
      equity = cash + position * currentBar.close;
      const positionValue = position * currentBar.close;

      // Calculate daily return
      const dailyReturn = previousEquity !== 0 ? (equity - previousEquity) / previousEquity : 0;
      dailyReturns.push(dailyReturn);

      // Calculate drawdown
      if (equity > peakEquity) {
        peakEquity = equity;
      }
      const drawdown = peakEquity > 0 ? (peakEquity - equity) / peakEquity : 0;

      equityPoints.push({
        id: uuidv4(),
        backtest_id: this.backtestId,
        timestamp: currentBar.timestamp,
        equity,
        cash,
        position_value: positionValue,
        daily_return: dailyReturn,
        drawdown,
        created_at: new Date(),
      });

      previousEquity = equity;
    }

    // Process any remaining pending signal (shouldn't happen if strategy is correct)
    // We do NOT execute it since there's no next bar to execute against

    strategy.finalize();

    const metrics = this.calculateMetrics(equityPoints, trades);

    return {
      trades,
      equityCurve: equityPoints,
      finalEquity: equity,
      metrics,
    };
  }

  private executeSignal(
    signal: Signal,
    marketPrice: number,
    currentCash: number,
    currentPosition: number,
    _currentEquity: number
  ): {
    executionPrice: number;
    quantity: number;
    commission: number;
    slippageAmount: number;
    newCash: number;
    newPosition: number;
  } {
    if (signal.action === 'BUY' && signal.quantity) {
      const executionPrice = marketPrice * (1 + this.config.slippage);
      const quantity = Math.min(signal.quantity, Math.floor(currentCash / executionPrice));
      const commission = this.config.commission;
      const slippageAmount = executionPrice - marketPrice;
      const cost = quantity * executionPrice + commission;
      const newCash = currentCash - cost;

      return {
        executionPrice,
        quantity,
        commission,
        slippageAmount,
        newCash,
        newPosition: currentPosition + quantity,
      };
    }

    if (signal.action === 'SELL' && signal.quantity) {
      const executionPrice = marketPrice * (1 - this.config.slippage);
      const quantity = Math.min(signal.quantity, currentPosition);
      const commission = this.config.commission;
      const slippageAmount = marketPrice - executionPrice;
      const proceeds = quantity * executionPrice - commission;
      const newCash = currentCash + proceeds;

      return {
        executionPrice,
        quantity,
        commission,
        slippageAmount,
        newCash,
        newPosition: currentPosition - quantity,
      };
    }

    return {
      executionPrice: marketPrice,
      quantity: 0,
      commission: 0,
      slippageAmount: 0,
      newCash: currentCash,
      newPosition: currentPosition,
    };
  }

  private calculateTradesPnl(signal: Signal, executionPrice: number, quantity: number): number | null {
    if (signal.action === 'BUY') {
      return null;
    }
    if (signal.action === 'SELL') {
      return quantity * executionPrice;
    }
    return null;
  }

  private createTrade(
    signal: Signal,
    executionPrice: number,
    quantity: number,
    execPrice: number,
    commission: number,
    slippageAmount: number,
    pnl: number | null,
    timestamp: Date
  ): BacktestTrade {
    return {
      id: uuidv4(),
      backtest_id: this.backtestId,
      timestamp,
      side: signal.action as TradeSide,
      quantity,
      price: executionPrice,
      execution_price: execPrice,
      commission,
      slippage_amount: slippageAmount,
      pnl,
      created_at: new Date(),
    };
  }

  private calculateMetrics(
    equityPoints: BacktestEquityPoint[],
    trades: BacktestTrade[]
  ): BacktestEngineMetrics {
    if (equityPoints.length === 0) {
      return this.zeroMetrics();
    }

    const firstPoint = equityPoints[0]!;
    const lastPoint = equityPoints[equityPoints.length - 1]!;
    const initialEquity = firstPoint.equity;
    const finalEquity = lastPoint.equity;

    const totalReturn = initialEquity > 0 ? (finalEquity - initialEquity) / initialEquity : 0;

    const tradingDays = equityPoints.length;
    const annualizedReturn = initialEquity > 0 && tradingDays > 0
      ? Math.pow(finalEquity / initialEquity, 252 / tradingDays) - 1
      : 0;

    const dailyReturns = equityPoints
      .map((ep) => ep.daily_return)
      .filter((r): r is number => r !== null);

    const volatility = this.calculateVolatility(dailyReturns);

    const meanReturn = dailyReturns.length > 0
      ? dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length
      : 0;
    const stdReturn = this.calculateStdDev(dailyReturns, meanReturn);
    const sharpeRatio = stdReturn > 0 ? (meanReturn / stdReturn) * Math.sqrt(252) : null;

    const downsideReturns = dailyReturns.filter((r) => r < 0);
    const downsideVariance = downsideReturns.length > 0
      ? downsideReturns.reduce((sum, r) => sum + r * r, 0) / downsideReturns.length
      : 0;
    const downsideStd = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideStd > 0 ? (meanReturn / downsideStd) * Math.sqrt(252) : null;

    const drawdowns = equityPoints
      .map((ep) => ep.drawdown)
      .filter((d): d is number => d !== null);
    const maxDrawdown = drawdowns.length > 0 ? Math.max(...drawdowns) : 0;

    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : null;

    const sellTrades = trades.filter((t) => t.side === 'SELL');
    const totalTrades = sellTrades.length;

    const pnlValues = sellTrades
      .map((t) => t.pnl)
      .filter((p): p is number => p !== null);

    const winningTrades = pnlValues.filter((p) => p > 0);
    const losingTrades = pnlValues.filter((p) => p < 0);

    const winRate = totalTrades > 0 ? winningTrades.length / totalTrades : null;

    const totalWinningPnl = winningTrades.reduce((sum, p) => sum + p, 0);
    const totalLosingPnl = losingTrades.reduce((sum, p) => sum + p, 0);
    const profitFactor = totalLosingPnl !== 0 ? totalWinningPnl / Math.abs(totalLosingPnl) : null;

    const avgWinningTrade = winningTrades.length > 0
      ? totalWinningPnl / winningTrades.length
      : null;
    const avgLosingTrade = losingTrades.length > 0
      ? totalLosingPnl / losingTrades.length
      : null;
    const largestWinningTrade = winningTrades.length > 0 ? Math.max(...winningTrades) : null;
    const largestLosingTrade = losingTrades.length > 0 ? Math.min(...losingTrades) : null;
    const avgTrade = pnlValues.length > 0
      ? pnlValues.reduce((sum, p) => sum + p, 0) / pnlValues.length
      : null;

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      calmarRatio,
      winRate,
      profitFactor,
      totalTrades: totalTrades || null,
      winningTrades: winningTrades.length || null,
      losingTrades: losingTrades.length || null,
      avgWinningTrade,
      avgLosingTrade,
      largestWinningTrade,
      largestLosingTrade,
      avgTrade,
    };
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + (r - mean) * (r - mean), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / values.length;
    return Math.sqrt(variance);
  }

  private zeroMetrics(): BacktestEngineMetrics {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: null,
      sortinoRatio: null,
      maxDrawdown: 0,
      calmarRatio: null,
      winRate: null,
      profitFactor: null,
      totalTrades: null,
      winningTrades: null,
      losingTrades: null,
      avgWinningTrade: null,
      avgLosingTrade: null,
      largestWinningTrade: null,
      largestLosingTrade: null,
      avgTrade: null,
    };
  }

  private createEmptyResult(): BacktestEngineResult {
    return {
      trades: [],
      equityCurve: [],
      finalEquity: this.config.initialCapital,
      metrics: this.zeroMetrics(),
    };
  }
}
