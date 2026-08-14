import type { Bar, MarketData, Signal, Strategy, StrategyParameters } from '../strategies/types.js';
import { roundMoney, roundPrice, wholeShares } from '../utils/money.js';

export interface EngineConfig {
  initialCapital: number;
  /** Commission as a fraction of trade value (e.g. 0.001 = 0.1%). */
  commission: number;
  /** Slippage as a fraction of the market price (e.g. 0.0005). */
  slippage: number;
  parameters: StrategyParameters;
}

export interface EngineTrade {
  timestamp: number;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  entryPrice: number | null;
  exitPrice: number | null;
  commission: number;
  slippageCost: number;
  pnl: number | null;
}

export interface EngineEquityPoint {
  timestamp: number;
  equity: number;
  cash: number;
  positionValue: number;
  dailyReturn: number | null;
  /** Negative fraction (0 to -1) below the running equity peak. */
  drawdown: number | null;
}

export interface EngineResult {
  trades: EngineTrade[];
  equity: EngineEquityPoint[];
  benchmarkEquity: EngineEquityPoint[];
  finalEquity: number;
}

/**
 * Sequential historical backtest engine.
 *
 * EXECUTION MODEL (single, consistent, documented):
 *
 *   1. A signal is generated at the CLOSE of bar T from indicators that may
 *      only use bars 0..T (never T+1 and beyond).
 *   2. The order is executed at the OPEN of bar T+1 — the next available bar —
 *      because at bar T's close there is no executable price yet.
 *   3. A signal generated at the final bar can therefore never be executed
 *      (there is no next open). This is the platform's look-ahead guarantee.
 *
 * Because orders execute at the NEXT bar open, a strategy can never benefit
 * from information that would only exist later. See docs/backtesting.md.
 *
 * ACCOUNTING MODEL (LONG ONLY, no leverage, no shorting):
 *
 *   BUY  → executionPrice = open × (1 + slippage)
 *          tradeValue     = quantity × executionPrice
 *          commission     = tradeValue × commissionRate
 *          cash -= (tradeValue + commission); position += quantity
 *   SELL → executionPrice = open × (1 − slippage)
 *          tradeValue     = quantity × executionPrice
 *          commission     = tradeValue × commissionRate
 *          cash += (tradeValue − commission); position -= quantity
 *          realizedPnl    = proceeds − costBasis(units sold) − commission
 *
 * Sizing is whole shares: BUY invests as much cash as is affordable without
 * leverage; SELL liquidates the entire position.
 */
export function runBacktest(
  market: MarketData,
  strategy: Strategy,
  config: EngineConfig,
): EngineResult {
  const bars = market.bars;
  const initialCapital = Math.max(config.initialCapital, 0);
  const commissionRate = Math.max(config.commission, 0);
  const slippageRate = Math.max(config.slippage, 0);

  const state = strategy.createState();
  let cash = initialCapital;
  let position = 0; // units held (whole shares)
  let avgCost = 0; // average cost basis per unit
  let pendingSignal: Signal | null = null;
  let peakEquity = initialCapital;
  let previousEquity: number | null = null;

  const trades: EngineTrade[] = [];
  const equity: EngineEquityPoint[] = [];

  for (let index = 0; index < bars.length; index += 1) {
    const bar = bars[index]!;

    // 1. Execute the previous bar's signal at this bar's open.
    if (pendingSignal === 'BUY' && position === 0 && cash > 0) {
      executeBuy(bar);
    } else if (pendingSignal === 'SELL' && position > 0) {
      executeSell(bar);
    }

    // 2. Feed this bar to the strategy (state now includes bars 0..index).
    strategy.onBar(state, bar, index, config.parameters);

    // 3. Generate the signal at this bar's close → pending for next open.
    pendingSignal = strategy.generateSignal(state, config.parameters);

    // 4. Record the equity snapshot at this bar's close.
    const positionValue = position * bar.close;
    const currentEquity = cash + positionValue;
    const dailyReturn = previousEquity === null ? null : currentEquity / previousEquity - 1;
    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const drawdown = currentEquity / peakEquity - 1;

    equity.push({
      timestamp: bar.timestamp,
      equity: roundMoney(currentEquity),
      cash: roundMoney(cash),
      positionValue: roundMoney(positionValue),
      dailyReturn: dailyReturn === null ? null : dailyReturn,
      drawdown,
    });

    previousEquity = currentEquity;
  }

  const benchmarkEquity = computeBuyAndHold(bars, initialCapital, commissionRate, slippageRate);

  return {
    trades,
    equity,
    benchmarkEquity,
    finalEquity: equity.length > 0 ? equity[equity.length - 1]!.equity : initialCapital,
  };

  function executeBuy(bar: Bar): void {
    const executionPrice = roundPrice(bar.open * (1 + slippageRate));
    // Whole shares the portfolio can afford including commission, no leverage.
    const maxQuantity = wholeShares(cash / (executionPrice * (1 + commissionRate)));
    if (maxQuantity <= 0) return;

    const tradeValue = executionPrice * maxQuantity;
    const commission = roundMoney(tradeValue * commissionRate);
    const totalCost = tradeValue + commission;

    // Guard against rounding pushing the order past available cash.
    const finalQuantity =
      totalCost <= cash ? maxQuantity : wholeShares(cash / (executionPrice * (1 + commissionRate)) - 1);
    if (finalQuantity <= 0) return;

    const finalValue = executionPrice * finalQuantity;
    const finalCommission = roundMoney(finalValue * commissionRate);
    const finalCost = finalValue + finalCommission;

    cash -= finalCost;
    const newPosition = position + finalQuantity;
    avgCost = newPosition > 0 ? (avgCost * position + finalCost) / newPosition : 0;
    position = newPosition;

    trades.push({
      timestamp: bar.timestamp,
      side: 'BUY',
      quantity: finalQuantity,
      price: executionPrice,
      entryPrice: executionPrice,
      exitPrice: null,
      commission: finalCommission,
      slippageCost: roundMoney(finalValue * slippageRate),
      pnl: null,
    });
  }

  function executeSell(bar: Bar): void {
    const executionPrice = roundPrice(bar.open * (1 - slippageRate));
    const quantity = position;
    if (quantity <= 0) return;

    const tradeValue = executionPrice * quantity;
    const commission = roundMoney(tradeValue * commissionRate);
    const costBasis = avgCost * quantity;
    const pnl = roundMoney(tradeValue - commission - costBasis);
    const entryPrice = roundPrice(avgCost);

    cash += tradeValue - commission;
    position = 0;
    avgCost = 0;

    trades.push({
      timestamp: bar.timestamp,
      side: 'SELL',
      quantity,
      price: executionPrice,
      entryPrice, // cost basis of the units just sold
      exitPrice: executionPrice,
      commission,
      slippageCost: roundMoney(tradeValue * slippageRate),
      pnl,
    });
  }
}

/**
 * Buy & Hold benchmark: invest the full initial capital at the FIRST bar open
 * (with the same commission + slippage as the strategy) and hold to the last
 * close. Used to value the benchmark at every bar for fair comparison.
 */
function computeBuyAndHold(
  bars: Bar[],
  initialCapital: number,
  commissionRate: number,
  slippageRate: number,
): EngineEquityPoint[] {
  if (bars.length === 0) return [];
  const first = bars[0]!;
  const entryPrice = first.open * (1 + slippageRate);
  const quantity = wholeShares(initialCapital / (entryPrice * (1 + commissionRate)));
  const invested = quantity * entryPrice;
  const commission = invested * commissionRate;
  const startingCash = initialCapital - invested - commission;

  let peak = initialCapital;
  let previousEquity: number | null = null;
  return bars.map((bar) => {
    const positionValue = quantity * bar.close;
    const currentEquity = startingCash + positionValue;
    if (currentEquity > peak) peak = currentEquity;
    const dailyReturn = previousEquity === null ? null : currentEquity / previousEquity - 1;
    previousEquity = currentEquity;
    return {
      timestamp: bar.timestamp,
      equity: roundMoney(currentEquity),
      cash: roundMoney(startingCash),
      positionValue: roundMoney(positionValue),
      dailyReturn,
      drawdown: currentEquity / peak - 1,
    };
  });
}
