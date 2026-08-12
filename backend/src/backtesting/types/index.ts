/**
 * Backtesting domain types shared across the module. Numbers are always JS
 * `number` at the service boundary; PostgreSQL stores them as NUMERIC.
 */

export type BacktestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export const BACKTEST_STATUSES: readonly BacktestStatus[] = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
] as const;

/** Stable, machine-readable error codes for the backtesting module. */
export const BACKTEST_ERROR_CODES = {
  DATASET_NOT_FOUND: 'BACKTEST_DATASET_NOT_FOUND',
  DATASET_NOT_COMPATIBLE: 'BACKTEST_DATASET_NOT_COMPATIBLE',
  INVALID_STRATEGY: 'BACKTEST_INVALID_STRATEGY',
  INVALID_PARAMETER: 'BACKTEST_INVALID_PARAMETER',
  INVALID_DATE_RANGE: 'BACKTEST_INVALID_DATE_RANGE',
  INVALID_MARKET_DATA: 'BACKTEST_INVALID_MARKET_DATA',
  EXECUTION_FAILED: 'BACKTEST_EXECUTION_FAILED',
  INSUFFICIENT_DATA: 'BACKTEST_INSUFFICIENT_DATA',
  NOT_FOUND: 'BACKTEST_NOT_FOUND',
  NOT_READY: 'BACKTEST_DATASET_NOT_READY',
} as const;

export interface BacktestConfig {
  datasetId: string;
  strategyId: string;
  parameters: Record<string, unknown>;
  initialCapital: number;
  commission: number;
  slippage: number;
  startDate?: string | null;
  endDate?: string | null;
  name?: string | null;
}

/** `backtests` table row (camelCase). */
export interface BacktestRow {
  id: string;
  userId: string;
  datasetId: string;
  strategyId: string;
  name: string;
  symbol: string;
  initialCapital: number;
  commission: number;
  slippage: number;
  parameters: Record<string, unknown>;
  startDate: string | null;
  endDate: string | null;
  status: BacktestStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRecord {
  id?: string;
  timestamp: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  /** Slippage-adjusted execution price. */
  price: number;
  /** Average cost basis at execution time (SELL) or execution price (BUY). */
  entryPrice: number | null;
  /** Execution price (SELL) or null (BUY). */
  exitPrice: number | null;
  commission: number;
  slippageCost: number;
  /** Realized P&L on SELL trades, null on BUY. */
  pnl: number | null;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
  cash: number;
  positionValue: number;
  dailyReturn: number | null;
  /** Negative fraction (0 to -1) below the running equity peak. */
  drawdown: number | null;
}

export interface EquitySeriesPoint {
  timestamp: string;
  strategy: number | null;
  benchmark: number | null;
}

export interface PerformanceMetrics {
  totalReturn: number | null;
  annualizedReturn: number | null;
  cagr: number | null;
  volatility: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  calmarRatio: number | null;
  maxDrawdown: number | null;
  winRate: number | null;
  profitFactor: number | null;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number | null;
  avgLoss: number | null;
  avgTrade: number | null;
  largestWin: number | null;
  largestLoss: number | null;
}

export interface BenchmarkMetrics {
  totalReturn: number | null;
  cagr: number | null;
  volatility: number | null;
  maxDrawdown: number | null;
  finalEquity: number | null;
}

export interface BacktestSummary {
  id: string;
  name: string;
  datasetId: string;
  datasetName: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  status: BacktestStatus;
  initialCapital: number;
  finalEquity: number | null;
  totalReturn: number | null;
  cagr: number | null;
  sharpeRatio: number | null;
  maxDrawdown: number | null;
  totalTrades: number | null;
  commission: number;
  slippage: number;
  startDate: string | null;
  endDate: string | null;
  errorMessage: string | null;
  createdAt: string;
}

/** Lightweight market-data compatibility summary for a dataset. */
export interface MarketCompatibility {
  datasetId: string;
  compatible: boolean;
  dateColumn: string | null;
  openColumn: string | null;
  highColumn: string | null;
  lowColumn: string | null;
  closeColumn: string | null;
  volumeColumn: string | null;
  issues: string[];
}

/** Available date span of a backtestable dataset (used to bound date pickers). */
export interface DatasetDateRange {
  datasetId: string;
  /** ISO date of the first usable row, or null when there are none. */
  startDate: string | null;
  /** ISO date of the last usable row, or null when there are none. */
  endDate: string | null;
  totalRows: number;
  dateColumn: string;
}
