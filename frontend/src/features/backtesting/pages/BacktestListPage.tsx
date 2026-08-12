import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/Button';
import { DashboardLayout } from '../../dashboard/components/DashboardLayout';
import { useBacktests, useDeleteBacktest } from '../hooks/useBacktest';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/20',
  running: 'bg-blue-400/10 text-blue-400 ring-blue-400/20',
  completed: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
  failed: 'bg-red-400/10 text-red-400 ring-red-400/20',
};

export function BacktestListPage() {
  return (
    <DashboardLayout activeNav="Backtesting">
      <BacktestListContent />
    </DashboardLayout>
  );
}

function BacktestListContent() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useBacktests(page, 10);
  const deleteBacktest = useDeleteBacktest();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete backtest "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteBacktest.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="section-label">Backtesting</span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Your Backtests</h2>
        </div>
        <Button variant="primary" onClick={() => navigate('/backtesting/new')}>
          New Backtest
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-sm text-slate-500">
          Loading backtests...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-400">
          Failed to load backtests. Please try again.
        </div>
      ) : !data?.items.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
          <p className="text-sm text-slate-400">No backtests yet</p>
          <p className="mt-2 text-xs text-slate-500">
            Create your first backtest to get started.
          </p>
          <Button
            variant="primary"
            className="mt-6"
            onClick={() => navigate('/backtesting/new')}
          >
            Create Backtest
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-5 py-3.5 font-medium text-slate-500">Name</th>
                    <th className="px-5 py-3.5 font-medium text-slate-500">Strategy</th>
                    <th className="px-5 py-3.5 font-medium text-slate-500">Status</th>
                    <th className="px-5 py-3.5 font-medium text-slate-500">Created</th>
                    <th className="px-5 py-3.5 text-right font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((bt) => (
                    <tr
                      key={bt.id}
                      className="border-b border-white/5 transition-colors hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => navigate(`/backtesting/${bt.id}`)}
                    >
                      <td className="px-5 py-3.5 font-medium text-white">{bt.name}</td>
                      <td className="px-5 py-3.5 text-slate-300">{bt.strategy_id}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={clsx(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1',
                            STATUS_STYLES[bt.status]
                          )}
                        >
                          {bt.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {format(new Date(bt.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(bt.id, bt.name);
                          }}
                          disabled={deletingId === bt.id}
                          className="rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                        >
                          {deletingId === bt.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * data.limit + 1}–{Math.min(page * data.limit, data.total)} of{' '}
                {data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
