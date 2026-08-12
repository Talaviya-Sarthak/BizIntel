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
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
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
        title="Analyses"
        description="Saved queries you can rerun anytime. Each execution produces a fresh, timestamped result."
        actions={
          <Button variant="primary" onClick={() => navigate('/datamart/query')}>
            <PlusIcon className="h-4 w-4" />
            New analysis
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={TrendingUpIcon}
          title="No analyses yet"
          description="Build your first query and save it as a reusable analysis."
          action={
            <Button onClick={() => navigate('/datamart/query')}>
              <PlusIcon className="h-4 w-4" />
              New query
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Datasets</th>
                  <th className="px-4 py-3 font-medium">Dimensions</th>
                  <th className="px-4 py-3 font-medium">Metrics</th>
                  <th className="px-4 py-3 font-medium">Last run</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((analysis) => (
                  <tr
                    key={analysis.id}
                    className="cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                    onClick={() => navigate(`/datamart/analyses/${analysis.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{analysis.name}</p>
                      {analysis.description ? (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                          {analysis.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{analysis.datasetIds.length}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {analysis.queryConfig.dimensions.length}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{analysis.queryConfig.metrics.length}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {analysis.lastExecutedAt ? formatDate(analysis.lastExecutedAt) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Run ${analysis.name}`}
                          title="Run now"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-cyan-400/10 hover:text-cyan-300 disabled:opacity-50"
                          disabled={executeMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRun(analysis.id);
                          }}
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${analysis.name}`}
                          title="Delete"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
                          disabled={deleteMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(analysis.id);
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
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
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}

      {executeMutation.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {describeDataMartError(toApiError(executeMutation.error)).message}
        </p>
      ) : null}
    </div>
  );
}