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
  start_date: string | null;
  end_date: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface BacktestMetrics {
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
}

export interface BacktestEquityPoint {
  timestamp: string;
  equity: number;
  cash: number;
  position_value: number;
  daily_return: number | null;
  drawdown: number | null;
}

export interface BacktestTrade {
  id: string;
  timestamp: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  execution_price: number;
  commission: number;
  slippage_amount: number;
  pnl: number | null;
}

export interface BacktestDetail {
  backtest: Backtest;
  metrics: BacktestMetrics;
  equity: BacktestEquityPoint[];
  trades: BacktestTrade[];
  benchmark?: {
    total_return: number;
    annualized_return: number;
    max_drawdown: number;
    volatility: number;
    final_equity: number;
  };
}

export interface BacktestListResponse {
  items: Backtest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateBacktestInput {
  dataset_id: string;
  strategy_id: string;
  name: string;
  parameters: Record<string, number>;
  initial_capital: number;
  commission: number;
  slippage: number;
  start_date?: string;
  end_date?: string;
}
