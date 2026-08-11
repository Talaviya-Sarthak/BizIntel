import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Spinner } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import {
  ActivityIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  LayersIcon,
  PlayIcon,
  TrashIcon,
  TrendingUpIcon,
} from '../../../components/ui/icons';
import { toApiError } from '../../../lib/api';
import { formatNumber } from '../../../utils/format';
import { useBacktest, useDeleteBacktest, useEquitySeries, useTrades } from '../hooks/useBacktesting';
import { BacktestStatusBadge } from '../components/BacktestStatusBadge';
import { MetricCard } from '../components/MetricCard';
import { DrawdownChart, EquityChart } from '../components/EquityChart';
import { TradeTable } from '../components/TradeTable';
import { formatCurrency, formatPercent, formatRatio, formatShortDate } from '../utils/formatting';
import { describeBacktestError } from '../utils/backtestErrors';

const TRADES_PAGE_SIZE = 50;

export function BacktestResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tradesOffset, setTradesOffset] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const backtestQuery = useBacktest(id);
  const equityQuery = useEquitySeries(id);
  const tradesQuery = useTrades(id, tradesOffset, TRADES_PAGE_SIZE);
  const deleteMutation = useDeleteBacktest();

  if (backtestQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (backtestQuery.isError || !backtestQuery.data) {
    return (
      <ErrorState
        message={toApiError(backtestQuery.error).message}
        onRetry={() => backtestQuery.refetch()}
      />
    );
  }

  const { backtest, metrics, benchmark, finalEquity } = backtestQuery.data;
  const failedView = backtest.status === 'FAILED' ? describeBacktestError({ message: backtest.errorMessage ?? undefined }) : null;

  async function handleDelete() {
    if (!id) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/backtesting');
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/backtesting"
        className="inline-flex w-fit items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-cyan-300"
      >
        <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
        Backtesting
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{backtest.name}</h1>
            <BacktestStatusBadge status={backtest.status} />
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
            {backtest.strategyName} on <span className="text-slate-300">{backtest.datasetName}</span> ·{' '}
            {backtest.symbol}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-slate-600" />
              {formatShortDate(backtest.startDate)} → {formatShortDate(backtest.endDate)}
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUpIcon className="h-3.5 w-3.5 text-slate-600" />
              Initial {formatCurrency(backtest.initialCapital)} · Commission {(backtest.commission * 100).toFixed(1)}% ·
              Slippage {(backtest.slippage * 100).toFixed(1)}%
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/backtesting/new?dataset=${backtest.datasetId}`)}>
            <PlayIcon className="h-4 w-4" />
            Run again
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={deleteMutation.isPending}
            onClick={() => void handleDelete()}
            className="text-slate-300 hover:text-red-300"
          >
            <TrashIcon className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </header>

      {backtest.status === 'FAILED' && failedView ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
          <div>
            <p className="text-sm font-medium text-red-300">{failedView.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-red-200/70">{failedView.message}</p>
            <p className="mt-2 text-sm leading-relaxed text-red-200/90">
              <span className="font-semibold text-red-300">What to do: </span>
              {failedView.suggestion}
            </p>
          </div>
        </div>
      ) : null}

      {deleteError ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}

      {backtest.status === 'COMPLETED' && metrics ? (
        <>
          <section aria-label="Key metrics">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Final equity"
                value={formatCurrency(finalEquity)}
                icon={LayersIcon}
                accent="cyan"
                hint={`from ${formatCurrency(backtest.initialCapital)}`}
              />
              <MetricCard
                label="Total return"
                value={formatPercent(metrics.totalReturn)}
                icon={TrendingUpIcon}
                accent={metrics.totalReturn && metrics.totalReturn >= 0 ? 'emerald' : 'rose'}
              />
              <MetricCard label="CAGR" value={formatPercent(metrics.cagr)} icon={ActivityIcon} accent="violet" />
              <MetricCard label="Max drawdown" value={formatPercent(metrics.maxDrawdown ? -metrics.maxDrawdown : metrics.maxDrawdown)} icon={ActivityIcon} accent="rose" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Sharpe ratio" value={formatRatio(metrics.sharpeRatio)} icon={ActivityIcon} accent="cyan" />
              <MetricCard label="Volatility" value={formatPercent(metrics.volatility)} icon={ActivityIcon} accent="slate" />
              <MetricCard label="Win rate" value={formatPercent(metrics.winRate)} accent="emerald" hint={`${metrics.winningTrades}W / ${metrics.losingTrades}L`} />
              <MetricCard label="Profit factor" value={formatRatio(metrics.profitFactor)} accent="violet" hint={`${formatNumber(metrics.totalTrades)} trades`} />
            </div>
          </section>

          <section aria-label="Equity curve" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Equity vs Buy &amp; Hold
            </h2>
            {equityQuery.isLoading ? <Spinner size="md" /> : null}
            {equityQuery.isError ? (
              <ErrorState message={toApiError(equityQuery.error).message} onRetry={() => equityQuery.refetch()} />
            ) : null}
            {equityQuery.data ? <EquityChart data={equityQuery.data} /> : null}
          </section>

          <section aria-label="Drawdown" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Drawdown</h2>
            {equityQuery.data ? <DrawdownChart data={equityQuery.data} /> : null}
          </section>

          <section aria-label="Benchmark" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Buy &amp; Hold benchmark
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Benchmark return" value={formatPercent(benchmark?.totalReturn)} icon={CheckCircleIcon} accent="emerald" />
              <MetricCard label="Benchmark CAGR" value={formatPercent(benchmark?.cagr)} icon={CheckCircleIcon} accent="cyan" />
              <MetricCard label="Benchmark volatility" value={formatPercent(benchmark?.volatility)} icon={CheckCircleIcon} accent="slate" />
              <MetricCard label="Benchmark max DD" value={formatPercent(benchmark?.maxDrawdown ? -benchmark.maxDrawdown : benchmark?.maxDrawdown)} icon={CheckCircleIcon} accent="rose" />
            </div>
          </section>

          <section aria-label="Trade statistics" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Trade statistics</h2>
            <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <StatItem label="Total trades" value={formatNumber(metrics.totalTrades)} />
              <StatItem label="Winning / losing" value={`${formatNumber(metrics.winningTrades)} / ${formatNumber(metrics.losingTrades)}`} />
              <StatItem label="Average trade" value={formatCurrency(metrics.avgTrade)} />
              <StatItem label="Average win" value={formatCurrency(metrics.avgWin)} />
              <StatItem label="Average loss" value={formatCurrency(metrics.avgLoss)} />
              <StatItem label="Largest win" value={formatCurrency(metrics.largestWin)} />
              <StatItem label="Largest loss" value={formatCurrency(metrics.largestLoss)} />
              <StatItem label="Sortino ratio" value={formatRatio(metrics.sortinoRatio)} />
              <StatItem label="Calmar ratio" value={formatRatio(metrics.calmarRatio)} />
            </div>
          </section>

          <section aria-label="Trades">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Executed trades</h2>
              {tradesQuery.data ? (
                <span className="text-xs text-slate-500">{formatNumber(tradesQuery.data.total)} total</span>
              ) : null}
            </div>
            {tradesQuery.isLoading ? <Spinner size="md" /> : null}
            {tradesQuery.isError ? (
              <ErrorState message={toApiError(tradesQuery.error).message} onRetry={() => tradesQuery.refetch()} />
            ) : null}
            {tradesQuery.data ? (
              <TradeTable
                trades={tradesQuery.data.trades}
                total={tradesQuery.data.total}
                offset={tradesOffset}
                onPageChange={setTradesOffset}
              />
            ) : null}
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Spinner size="sm" />
            This backtest has not completed yet.
          </p>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums text-slate-200">{value}</dd>
    </div>
  );
}
