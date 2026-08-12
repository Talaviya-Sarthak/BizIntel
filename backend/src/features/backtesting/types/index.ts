export type BacktestStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TradeSide = 'BUY' | 'SELL';

export interface MarketBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Signal {
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity?: number;
}

export interface StrategyContext {
  bars: MarketBar[];
  currentIndex: number;
  position: number;
  cash: number;
  equity: number;
}

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  parameters: StrategyParameter[];
}

export interface StrategyParameter {
  name: string;
  label: string;
  type: 'number';
  default: number;
  min: number;
  max: number;
  step: number;
  description: string;
}

export interface BacktestConfig {
  datasetId: string;
  strategyId: string;
  parameters: Record<string, number>;
  initialCapital: number;
  commission: number;
  slippage: number;
  startDate?: string;
  endDate?: string;
}

export interface BacktestTrade {
  id: string;
  backtest_id: string;
  timestamp: Date;
  side: TradeSide;
  quantity: number;
  price: number;
  execution_price: number;
  commission: number;
  slippage_amount: number;
  pnl: number | null;
  created_at: Date;
}

export interface BacktestMetrics {
  id: string;
  backtest_id: string;
  total_return: number | null;
  annualized_return: number | null;
  volatility: number | null;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  max_drawdown: number | null;
  calmar_ratio: number | null;
  win_rate: number | null;
  profit_factor: number | null;
  total_trades: number | null;
  winning_trades: number | null;
  losing_trades: number | null;
  avg_winning_trade: number | null;
  avg_losing_trade: number | null;
  largest_winning_trade: number | null;
  largest_losing_trade: number | null;
  avg_trade: number | null;
  created_at: Date;
}

export interface BacktestEquityPoint {
  id: string;
  backtest_id: string;
  timestamp: Date;
  equity: number;
  cash: number;
  position_value: number;
  daily_return: number | null;
  drawdown: number | null;
  created_at: Date;
}

export interface Backtest {
  id: string;
  user_id: string;
  dataset_id: string;
  strategy_id: string;
  name: string;
  parameters: Record<string, number>;
  initial_capital: number;
  commission: number;
  slippage: number;
  start_date: Date | null;
  end_date: Date | null;
  status: BacktestStatus;
  error_message: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BenchmarkResult {
  total_return: number;
  annualized_return: number;
  max_drawdown: number;
  volatility: number;
  final_equity: number;
}
