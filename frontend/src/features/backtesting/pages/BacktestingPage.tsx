import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Spinner } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PlusIcon, TrendingUpIcon, TrashIcon } from '../../../components/ui/icons';
import { toApiError } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import { useBacktests, useDeleteBacktest } from '../hooks/useBacktesting';
import { BacktestStatusBadge } from '../components/BacktestStatusBadge';
import { formatCurrency, formatPercent } from '../utils/formatting';
import type { BacktestSummary } from '../types';

export function BacktestingPage() {
  const navigate = useNavigate();
  const backtestsQuery = useBacktests();
  const deleteMutation = useDeleteBacktest();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(backtest: BacktestSummary) {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(backtest.id);
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Backtesting"
        description="Run historical strategies against your datasets and compare performance against a Buy & Hold benchmark."
        actions={
          <Button onClick={() => navigate('/backtesting/new')}>
            <PlusIcon className="h-4 w-4" />
            New Backtest
          </Button>
        }
      />

      {backtestsQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
          <Spinner size="md" />
        </div>
      ) : backtestsQuery.isError ? (
        <ErrorState
          message={toApiError(backtestsQuery.error).message}
          onRetry={() => backtestsQuery.refetch()}
        />
      ) : backtestsQuery.data && backtestsQuery.data.items.length === 0 ? (
        <EmptyState
          icon={TrendingUpIcon}
          title="No backtests yet"
          description="Create your first backtest by picking a strategy and a dataset with OHLCV market data."
          action={
            <Button onClick={() => navigate('/backtesting/new')}>
              <PlusIcon className="h-4 w-4" />
              New Backtest
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Backtest</th>
                  <th className="px-4 py-3 font-medium">Strategy</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Initial Capital</th>
                  <th className="px-4 py-3 text-right font-medium">Final Equity</th>
                  <th className="px-4 py-3 text-right font-medium">Return</th>
                  <th className="px-4 py-3 text-right font-medium">Max DD</th>
                  <th className="px-4 py-3 text-right font-medium">Trades</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {backtestsQuery.data?.items.map((backtest) => (
                  <tr
                    key={backtest.id}
                    className="cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                    onClick={() => navigate(`/backtesting/${backtest.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{backtest.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {backtest.datasetName} · {backtest.symbol}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{backtest.strategyName}</td>
                    <td className="px-4 py-3">
                      <BacktestStatusBadge status={backtest.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {formatCurrency(backtest.initialCapital)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-white">
                      {formatCurrency(backtest.finalEquity)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        backtest.totalReturn === null
                          ? 'text-slate-500'
                          : backtest.totalReturn >= 0
                            ? 'text-emerald-300'
                            : 'text-rose-300'
                      }`}
                    >
                      {formatPercent(backtest.totalReturn)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-300">
                      {backtest.maxDrawdown === null ? '—' : formatPercent(-backtest.maxDrawdown)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {backtest.totalTrades ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(backtest.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label={`Delete ${backtest.name}`}
                        disabled={deleteMutation.isPending}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(backtest);
                        }}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteError ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}

      {backtestsQuery.data && backtestsQuery.data.items.length > 0 ? (
        <p className="text-xs text-slate-600">
          Total: {backtestsQuery.data.total} backtests ·{' '}
          <Link to="/datasets" className="text-cyan-400 hover:underline">
            open a dataset
          </Link>{' '}
          to run a new one.
        </p>
      ) : null}
    </div>
  );
}
