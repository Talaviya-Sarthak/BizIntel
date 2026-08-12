import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button, Spinner } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Modal } from '../../../components/ui/Modal';
import { toApiError } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import {
  PlayIcon,
  TrashIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '../../../components/ui/icons';
import {
  useAnalysis,
  useAnalysisRuns,
  useDeleteAnalysis,
  useExecuteAnalysis,
} from '../hooks/useAnalyses';
import { useDataMartOverview } from '../hooks/useDataMartOverview';
import { describeDataMartError } from '../utils/datamartErrors';
import { QuerySummary } from '../components/QuerySummary';
import { QueryResultViewer } from '../components/QueryResultViewer';
import type { DataMartQueryResult } from '../types';

export function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const analysisQuery = useAnalysis(id);
  const runsQuery = useAnalysisRuns(id);
  const overviewQuery = useDataMartOverview();
  const execute = useExecuteAnalysis();
  const deleteMutation = useDeleteAnalysis();

  const [latestResult, setLatestResult] = useState<DataMartQueryResult | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const analysis = analysisQuery.data;
  const datasetNames = new Map<string, string>();
  if (analysis) {
    analysis.datasetIds.forEach((datasetId) => datasetNames.set(datasetId, datasetId.slice(0, 8)));
  }
  overviewQuery.data?.recentDatasets.forEach((dataset) =>
    datasetNames.set(dataset.id, dataset.name),
  );

  async function handleRun() {
    if (!id) return;
    try {
      const result = await execute.mutateAsync(id);
      setLatestResult(result);
    } catch {
      // surfaced via execute.errorMessage
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/datamart/analyses');
    } catch {
      // surfaced via deleteMutation.errorMessage
    }
  }

  if (!id) return null;
  if (analysisQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (analysisQuery.isError || !analysis) {
    return (
      <ErrorState
        message={toApiError(analysisQuery.error).message}
        onRetry={() => analysisQuery.refetch()}
      />
    );
  }

  const runs = runsQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={analysis.name}
        description={analysis.description ?? 'Saved DataMart analysis'}
        actions={
          <>
            <Button
              variant="primary"
              loading={execute.isPending}
              onClick={() => void handleRun()}
            >
              <PlayIcon className="h-4 w-4" />
              {execute.isPending ? 'Running…' : 'Run now'}
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteOpen(true)}
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      {execute.error ? (
        <ErrorState
          title="Run failed"
          message={describeDataMartError(toApiError(execute.error)).message}
          onRetry={() => void handleRun()}
        />
      ) : null}

      {latestResult ? (
        <QueryResultViewer result={latestResult} />
      ) : analysis.lastExecutedAt ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
          Last run on {formatDate(analysis.lastExecutedAt)}. Press <span className="font-medium text-white">Run now</span> to see fresh results.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">Query configuration</h3>
            <QuerySummary query={analysis.queryConfig} datasetNames={datasetNames} />
          </section>
        </div>

        <div>
          <section className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <TrendingUpIcon className="h-4 w-4 text-cyan-400" />
              Run history
            </h3>
            {runsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading runs…</p>
            ) : runs.length === 0 ? (
              <EmptyState title="No runs yet" description="Run this analysis to see its history." />
            ) : (
              <ul className="flex flex-col">
                {runs.map((run) => (
                  <li
                    key={run.id}
                    className="flex items-center gap-3 border-b border-white/5 py-2.5 last:border-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-sm text-slate-300">
                        {run.status === 'SUCCESS' ? (
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 shrink-0 text-red-400" />
                        )}
                        {run.status === 'SUCCESS'
                          ? `${run.rowsReturned.toLocaleString('en-US')} rows`
                          : 'Failed'}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {formatDate(run.createdAt)} · {run.executionTimeMs} ms
                      </span>
                    </span>
                    {run.errorMessage ? (
                      <span
                        className="max-w-[160px] truncate text-xs text-red-300/80"
                        title={run.errorMessage}
                      >
                        {run.errorMessage}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete analysis"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => void handleDelete()}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          This deletes “{analysis.name}” and its run history. This cannot be undone.
        </p>
        {deleteMutation.error ? (
          <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-sm text-red-300">
            {toApiError(deleteMutation.error).message}
          </p>
        ) : null}
      </Modal>

      {analysis.name ? (
        <p className="flex items-center gap-1 text-xs text-slate-600">
          <ChevronRightIcon className="h-3.5 w-3.5" />
          Created {formatDate(analysis.createdAt)}
        </p>
      ) : null}
    </div>
  );
}