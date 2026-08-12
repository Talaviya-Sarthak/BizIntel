export type {
  StrategyMetadata,
  ParameterDef,
  BacktestSummary,
  PerformanceMetrics,
  EquitySeriesPoint,
  TradeRecord,
  BacktestDetail,
  BacktestCreateInput,
  BacktestStatus,
  BenchmarkMetrics,
  MarketCompatibility,
  DatasetDateRange,
  PaginatedTrades,
} from './types';

export { backtestService } from './services/backtest.service';

export {
  useStrategies,
  useCreateBacktest,
  useBacktests,
  useBacktest,
  useDeleteBacktest,
} from './hooks/useBacktest';

export { StrategyCard } from './components/StrategyCard';
export { ParameterForm } from './components/ParameterForm';
export { BacktestWizard } from './components/BacktestWizard';
export { BacktestResultDashboard } from './components/BacktestResultDashboard';
export { EquityCurveChart } from './components/EquityCurveChart';
export { DrawdownChart } from './components/DrawdownChart';
export { BenchmarkComparison } from './components/BenchmarkComparison';
export { TradeTable } from './components/TradeTable';

export { BacktestListPage } from './pages/BacktestListPage';
export { BacktestCreatePage } from './pages/BacktestCreatePage';
export { BacktestDetailPage } from './pages/BacktestDetailPage';
