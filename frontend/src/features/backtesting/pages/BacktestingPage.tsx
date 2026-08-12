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
    <div className="flex flex-col gap-6 bg-black">
      <PageHeader
        title="Backtesting"
        description="Run historical strategies against your datasets and compare performance against a Buy & Hold benchmark."
        actions={
          <Button onClick={() => navigate('/backtesting/new')}>
            <PlusIcon className="h-4.5 w-4.5" />
            New Backtest
          </Button>
        }
      />

      {backtestsQuery.isLoading ? (
        <div className="flex items-center justify-center border-2 border-white bg-ink-card py-24 rounded-md shadow-brutal-sm">
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
              <PlusIcon className="h-4.5 w-4.5" />
              New Backtest
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden border-2 border-white bg-black shadow-brutal-sm rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-xs font-bold uppercase tracking-wider">
              <thead>
                <tr className="border-b-2 border-white bg-ink-soft text-[10px] text-white">
                  <th className="px-4 py-3.5 font-bold">Backtest</th>
                  <th className="px-4 py-3.5 font-bold">Strategy</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 text-right font-bold">Initial Capital</th>
                  <th className="px-4 py-3.5 text-right font-bold">Final Equity</th>
                  <th className="px-4 py-3.5 text-right font-bold">Return</th>
                  <th className="px-4 py-3.5 text-right font-bold">Max DD</th>
                  <th className="px-4 py-3.5 text-right font-bold">Trades</th>
                  <th className="px-4 py-3.5 font-bold">Created</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y border-white/20 bg-black text-white">
                {backtestsQuery.data?.items.map((backtest) => (
                  <tr
                    key={backtest.id}
                    className="cursor-pointer transition-colors hover:bg-ink-card"
                    onClick={() => navigate(`/backtesting/${backtest.id}`)}
                  >
                    <td className="px-4 py-3.5 normal-case">
                      <p className="font-bold text-white text-sm">{backtest.name}</p>
                      <p className="mt-0.5 text-xs text-muted font-bold uppercase tracking-wider">
                        {backtest.datasetName} · {backtest.symbol}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-white">{backtest.strategyName}</td>
                    <td className="px-4 py-3.5">
                      <BacktestStatusBadge status={backtest.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-muted">
                      {formatCurrency(backtest.initialCapital)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-white">
                      {formatCurrency(backtest.finalEquity)}
                    </td>
                    <td
                      className={`px-4 py-3.5 text-right font-mono font-black ${
                        backtest.totalReturn === null
                          ? 'text-muted'
                          : backtest.totalReturn >= 0
                            ? 'text-lime'
                            : 'text-pink'
                      }`}
                    >
                      {formatPercent(backtest.totalReturn)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-pink">
                      {backtest.maxDrawdown === null ? '—' : formatPercent(-backtest.maxDrawdown)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-white">
                      {backtest.totalTrades ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-muted font-mono text-[10px]">{formatDate(backtest.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        aria-label={`Delete ${backtest.name}`}
                        disabled={deleteMutation.isPending}
                        className="inline-flex h-8 w-8 items-center justify-center text-muted hover:text-pink transition-colors disabled:opacity-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(backtest);
                        }}
                      >
                        <TrashIcon className="h-4.5 w-4.5" />
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
        <p className="border-2 border-pink bg-pink/5 px-4 py-3 text-sm font-bold uppercase tracking-wider text-pink rounded-md">
          {deleteError}
        </p>
      ) : null}

      {backtestsQuery.data && backtestsQuery.data.items.length > 0 ? (
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Total: {backtestsQuery.data.total} backtests ·{' '}
          <Link to="/datasets" className="text-lime hover:underline">
            open a dataset
          </Link>{' '}
          to run a new one.
        </p>
      ) : null}
    </div>
  );
}
