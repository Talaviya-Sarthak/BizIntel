export type BacktestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ParameterDef {
  name: string;
  label: string;
  type: 'number' | 'integer' | 'boolean';
  description: string;
  default: number | boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface StrategyMetadata {
  id: string;
  name: string;
  description: string;
  executionModel: string;
  parameters: ParameterDef[];
  defaults: Record<string, number | boolean>;
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
  parameters?: Record<string, number | boolean>;
}

export interface BacktestCreateInput {
  datasetId: string;
  strategyId: string;
  parameters: Record<string, number | boolean>;
  initialCapital: number;
  commission: number;
  slippage: number;
  startDate?: string | null;
  endDate?: string | null;
  name?: string;
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

export interface TradeRecord {
  id?: string;
  timestamp: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  entryPrice: number | null;
  exitPrice: number | null;
  commission: number;
  slippageCost: number;
  pnl: number | null;
}

export interface EquitySeriesPoint {
  timestamp: string;
  strategy: number | null;
  benchmark: number | null;
  drawdown?: number | null;
}

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

export interface DatasetDateRange {
  datasetId: string;
  startDate: string | null;
  endDate: string | null;
  totalRows: number;
  dateColumn: string;
}

export interface BacktestDetail {
  backtest: BacktestSummary;
  metrics: PerformanceMetrics | null;
  benchmark: BenchmarkMetrics | null;
  finalEquity: number | null;
}

export interface PaginatedTrades {
  trades: TradeRecord[];
  total: number;
}
