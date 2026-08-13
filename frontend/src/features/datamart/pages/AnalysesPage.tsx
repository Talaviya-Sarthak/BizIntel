import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button, Spinner } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { toApiError } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import { PlusIcon, TrendingUpIcon, TrashIcon, PlayIcon } from '../../../components/ui/icons';
import { useAnalyses, useDeleteAnalysis, useExecuteAnalysis } from '../hooks/useAnalyses';
import { describeDataMartError } from '../utils/datamartErrors';

export function AnalysesPage() {
  const navigate = useNavigate();
  const analysesQuery = useAnalyses();
  const deleteMutation = useDeleteAnalysis();
  const executeMutation = useExecuteAnalysis();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  async function handleRun(id: string) {
    try {
      await executeMutation.mutateAsync(id);
      navigate(`/datamart/analyses/${id}`);
    } catch {
      // error surfaced via executeMutation.errorMessage
    }
  }

  if (analysesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#181818] py-20">
        <Spinner size="md" />
      </div>
    );
  }

  if (analysesQuery.isError) {
    return (
      <ErrorState
        message={toApiError(analysesQuery.error).message}
        onRetry={() => analysesQuery.refetch()}
      />
    );
  }

  const items = analysesQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Saved Analyses"
        description="Saved queries you can rerun anytime. Each execution produces a fresh, timestamped result set."
        actions={
          <Button variant="primary" onClick={() => navigate('/datamart/query')} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs border border-white/20">
            <PlusIcon className="h-3.5 w-3.5" />
            New analysis
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={TrendingUpIcon}
          title="No analyses created yet"
          description="Build your first query and save it as a reusable analysis."
          action={
            <Button onClick={() => navigate('/datamart/query')} className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs">
              <PlusIcon className="h-3.5 w-3.5" />
              New query
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#181818] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold bg-zinc-900/60">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Datasets</th>
                  <th className="px-4 py-3 font-semibold">Dimensions</th>
                  <th className="px-4 py-3 font-semibold">Metrics</th>
                  <th className="px-4 py-3 font-semibold">Last run</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((analysis) => (
                  <tr
                    key={analysis.id}
                    className="cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.02]"
                    onClick={() => navigate(`/datamart/analyses/${analysis.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-100">{analysis.name}</p>
                      {analysis.description ? (
                        <p className="mt-0.5 max-w-xs truncate text-[11px] text-zinc-400">
                          {analysis.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono">{analysis.datasetIds.length}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono">
                      {analysis.queryConfig.dimensions.length}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono">{analysis.queryConfig.metrics.length}</td>
                    <td className="px-4 py-3 text-zinc-400 text-[11px]">
                      {analysis.lastExecutedAt ? formatDate(analysis.lastExecutedAt) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Run ${analysis.name}`}
                          title="Run now"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                          disabled={executeMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRun(analysis.id);
                          }}
                        >
                          <PlayIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${analysis.name}`}
                          title="Delete"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
                          disabled={deleteMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(analysis.id);
                          }}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
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

      {executeMutation.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
          {describeDataMartError(toApiError(executeMutation.error)).message}
        </p>
      ) : null}
    </div>
  );
}