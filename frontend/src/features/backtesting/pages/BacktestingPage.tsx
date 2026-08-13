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
        title="Quantitative Backtesting"
        description="Run historical strategies against your datasets and compare performance against a Buy & Hold benchmark."
        actions={
          <Button onClick={() => navigate('/backtesting/new')} className="bg-white text-black font-semibold text-xs hover:bg-zinc-200">
            <PlusIcon className="h-3.5 w-3.5" />
            New Backtest
          </Button>
        }
      />

      {backtestsQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#181818] py-20">
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
          title="No backtests created yet"
          description="Create your first backtest by picking a strategy and a dataset with OHLCV market data."
          action={
            <Button onClick={() => navigate('/backtesting/new')} className="bg-white text-black font-semibold text-xs hover:bg-zinc-200">
              <PlusIcon className="h-3.5 w-3.5" />
              New Backtest
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#181818] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold bg-zinc-900/60">
                  <th className="px-4 py-3 font-semibold">Backtest</th>
                  <th className="px-4 py-3 font-semibold">Strategy</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Initial Capital</th>
                  <th className="px-4 py-3 text-right font-semibold">Final Equity</th>
                  <th className="px-4 py-3 text-right font-semibold">Return</th>
                  <th className="px-4 py-3 text-right font-semibold">Max DD</th>
                  <th className="px-4 py-3 text-right font-semibold">Trades</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {backtestsQuery.data?.items.map((backtest) => (
                  <tr
                    key={backtest.id}
                    className="cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]"
                    onClick={() => navigate(`/backtesting/${backtest.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-100">{backtest.name}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {backtest.datasetName} · {backtest.symbol}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{backtest.strategyName}</td>
                    <td className="px-4 py-3">
                      <BacktestStatusBadge status={backtest.status} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-300 font-mono">
                      {formatCurrency(backtest.initialCapital)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-100 font-mono">
                      {formatCurrency(backtest.finalEquity)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums font-mono ${backtest.totalReturn === null
                          ? 'text-zinc-500'
                          : backtest.totalReturn >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                    >
                      {formatPercent(backtest.totalReturn)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-400 font-mono">
                      {backtest.maxDrawdown === null ? '—' : formatPercent(-backtest.maxDrawdown)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-300 font-mono">
                      {backtest.totalTrades ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-[11px]">{formatDate(backtest.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label={`Delete ${backtest.name}`}
                        disabled={deleteMutation.isPending}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(backtest);
                        }}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
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
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
          {deleteError}
        </p>
      ) : null}

      {backtestsQuery.data && backtestsQuery.data.items.length > 0 ? (
        <p className="text-xs text-zinc-400">
          Total: {backtestsQuery.data.total} backtests ·{' '}
          <Link to="/datasets" className="text-zinc-200 hover:text-white hover:underline transition-colors">
            open a dataset
          </Link>{' '}
          to run a new one.
        </p>
      ) : null}
    </div>
  );
}
