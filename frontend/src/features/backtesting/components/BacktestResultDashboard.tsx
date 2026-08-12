import { clsx } from 'clsx';
import type { Backtest, BacktestMetrics } from '../types';

interface BacktestResultDashboardProps {
  backtest: Backtest;
  metrics: BacktestMetrics;
}

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number | null, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(decimals);
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/20',
  running: 'bg-blue-400/10 text-blue-400 ring-blue-400/20',
  completed: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
  failed: 'bg-red-400/10 text-red-400 ring-red-400/20',
};

export function BacktestResultDashboard({ backtest, metrics }: BacktestResultDashboardProps) {
  const kpis: { label: string; value: string; positive?: boolean }[] = [
    { label: 'Total Return', value: formatPercent(metrics.total_return), positive: (metrics.total_return ?? 0) > 0 },
    { label: 'CAGR', value: formatPercent(metrics.annualized_return), positive: (metrics.annualized_return ?? 0) > 0 },
    { label: 'Sharpe Ratio', value: formatNumber(metrics.sharpe_ratio), positive: (metrics.sharpe_ratio ?? 0) > 1 },
    { label: 'Sortino Ratio', value: formatNumber(metrics.sortino_ratio), positive: (metrics.sortino_ratio ?? 0) > 1 },
    { label: 'Max Drawdown', value: formatPercent(metrics.max_drawdown), positive: false },
    { label: 'Win Rate', value: formatPercent(metrics.win_rate), positive: (metrics.win_rate ?? 0) > 0.5 },
    { label: 'Profit Factor', value: formatNumber(metrics.profit_factor), positive: (metrics.profit_factor ?? 0) > 1 },
    { label: 'Total Trades', value: String(metrics.total_trades ?? '—') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">{backtest.name}</h2>
          <p className="mt-1 text-xs text-slate-400">
            {backtest.strategy_id} · Created {new Date(backtest.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1',
            STATUS_STYLES[backtest.status]
          )}
        >
          {backtest.status}
        </span>
      </div>

      {backtest.error_message && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-xs font-medium text-red-400">Error</p>
          <p className="mt-1 text-xs text-red-300">{backtest.error_message}</p>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {kpi.label}
            </p>
            <p
              className={clsx(
                'mt-2 text-xl font-bold',
                kpi.positive === true
                  ? 'text-emerald-400'
                  : kpi.positive === false
                    ? 'text-red-400'
                    : 'text-white'
              )}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Strategy Details */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Strategy Configuration
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailRow label="Strategy" value={backtest.strategy_id} />
          <DetailRow label="Initial Capital" value={formatCurrency(backtest.initial_capital)} />
          <DetailRow label="Commission" value={`${(backtest.commission * 100).toFixed(2)}%`} />
          <DetailRow label="Slippage" value={`${(backtest.slippage * 100).toFixed(2)}%`} />
          {backtest.start_date && <DetailRow label="Start" value={backtest.start_date} />}
          {backtest.end_date && <DetailRow label="End" value={backtest.end_date} />}
          {Object.entries(backtest.parameters).map(([key, val]) => (
            <DetailRow key={key} label={key} value={String(val)} />
          ))}
        </div>
      </div>

      {/* Extended metrics */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Trade Statistics
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Volatility" value={formatPercent(metrics.volatility)} />
          <DetailRow label="Calmar Ratio" value={formatNumber(metrics.calmar_ratio)} />
          <DetailRow label="Winning Trades" value={String(metrics.winning_trades ?? '—')} />
          <DetailRow label="Losing Trades" value={String(metrics.losing_trades ?? '—')} />
          <DetailRow label="Avg Winning Trade" value={formatPercent(metrics.avg_winning_trade)} />
          <DetailRow label="Avg Losing Trade" value={formatPercent(metrics.avg_losing_trade)} />
          <DetailRow label="Largest Win" value={formatPercent(metrics.largest_winning_trade)} />
          <DetailRow label="Largest Loss" value={formatPercent(metrics.largest_losing_trade)} />
          <DetailRow label="Avg Trade" value={formatPercent(metrics.avg_trade)} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-xs font-medium text-white">{value}</span>
    </div>
  );
}
