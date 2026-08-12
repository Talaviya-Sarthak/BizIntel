import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonKpiCard } from '../../../components/ui/Skeleton';
import { toApiError } from '../../../lib/api';
import { formatNumber, formatDate } from '../../../utils/format';
import {
  DatabaseZapIcon,
  PlusIcon,
  FolderIcon,
  TrendingUpIcon,
  ChevronRightIcon,
  PlayIcon,
} from '../../../components/ui/icons';
import { useDataMartOverview } from '../hooks/useDataMartOverview';
import { useDeleteAnalysis, useExecuteAnalysis } from '../hooks/useAnalyses';
import type { MetricFormat } from '../types';

export function DataMartOverviewPage() {
  const navigate = useNavigate();
  const overview = useDataMartOverview();

  const deleteAnalysis = useDeleteAnalysis();
  const executeAnalysis = useExecuteAnalysis();

  if (overview.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="DataMart Analytics" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonKpiCard />
          <SkeletonKpiCard />
          <SkeletonKpiCard />
          <SkeletonKpiCard />
        </div>
      </div>
    );
  }

  if (overview.isError) {
    return (
      <ErrorState
        message={toApiError(overview.error).message}
        onRetry={() => overview.refetch()}
      />
    );
  }

  const data = overview.data!;
  const recentAnalyses = data.analyses.recent.slice(0, 5);
  const recentMetrics = data.metrics.recent.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="DataMart"
        description="Explore, analyze and visualize your datasets without SQL. Build a query, save it, and arrange results on dashboards."
        actions={
          <Button variant="primary" onClick={() => navigate('/datamart/query')}>
            <PlusIcon className="h-4 w-4" />
            New query
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Datasets"
          value={formatNumber(data.datasets.total)}
          sub={`${data.datasets.ready} ready · ${data.datasets.failed} failed`}
          to="/datasets"
        />
        <KpiCard
          label="Analyses"
          value={formatNumber(data.analyses.total)}
          sub={`${data.datasets.totalRows.toLocaleString('en-US')} rows indexed`}
          to="/datamart/analyses"
        />
        <KpiCard label="Metrics" value={formatNumber(data.metrics.total)} sub="Reusable KPIs" to="/datamart/metrics" />
        <KpiCard
          label="Dashboards"
          value={formatNumber(data.dashboards.total)}
          sub="Live widgets"
          to="/datamart/dashboards"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent runs */}
        <Panel
          title="Recent runs"
          icon={PlayIcon}
          action={
            <Link to="/datamart/analyses" className="text-xs font-medium text-cyan-400 hover:underline">
              View all
            </Link>
          }
        >
          {data.recentRuns.length === 0 ? (
            <EmptyState title="No runs yet" description="Run a query to see its history here." />
          ) : (
            <ul className="flex flex-col">
              {data.recentRuns.slice(0, 5).map((run) => (
                <li
                  key={run.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/5 py-3 last:border-0 hover:bg-white/[0.02]"
                  onClick={() => navigate(`/datamart/analyses/${run.analysisId}`)}
                >
                  <ChevronRightIcon className="h-4 w-4 text-slate-600" />
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-sm font-medium text-white">{run.analysisName}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {formatDate(run.createdAt)}
                    </span>
                  </span>
                  <span className="text-xs text-slate-500">{run.executionTimeMs} ms</span>
                  <RunBadge status={run.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent analyses */}
        <Panel
          title="Recent analyses"
          icon={TrendingUpIcon}
          action={
            <Link to="/datamart/analyses" className="text-xs font-medium text-cyan-400 hover:underline">
              View all
            </Link>
          }
        >
          {recentAnalyses.length === 0 ? (
            <EmptyState
              title="No analyses yet"
              description="Build and save your first query to see it here."
              action={
                <Button size="sm" onClick={() => navigate('/datamart/query')}>
                  <PlusIcon className="h-4 w-4" />
                  New query
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col">
              {recentAnalyses.map((analysis) => (
                <li
                  key={analysis.id}
                  className="cursor-pointer border-b border-white/5 py-3 last:border-0 hover:bg-white/[0.02]"
                  onClick={() => navigate(`/datamart/analyses/${analysis.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-white">{analysis.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Run analysis"
                      className="text-slate-500 hover:text-cyan-300"
                      onClick={(event) => {
                        event.stopPropagation();
                        void executeAnalysis.mutateAsync(analysis.id);
                      }}
                    >
                      <PlayIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <span>{analysis.datasetIds.length} dataset{analysis.datasetIds.length === 1 ? '' : 's'}</span>
                    {analysis.lastExecutedAt ? (
                      <>
                        <span>·</span>
                        <span>last run {formatDate(analysis.lastExecutedAt)}</span>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent metrics */}
        <Panel
          title="Recent metrics"
          icon={DatabaseZapIcon}
          action={
            <Link to="/datamart/metrics" className="text-xs font-medium text-cyan-400 hover:underline">
              View all
            </Link>
          }
        >
          {recentMetrics.length === 0 ? (
            <EmptyState
              title="No metrics yet"
              description="Promote a query to a reusable metric to see it here."
            />
          ) : (
            <ul className="flex flex-col">
              {recentMetrics.map((metric) => (
                <li
                  key={metric.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/5 py-3 last:border-0 hover:bg-white/[0.02]"
                  onClick={() => navigate('/datamart/metrics')}
                >
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-sm font-medium text-white">{metric.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {metric.datasetName ?? '—'}
                    </span>
                  </span>
                  <MetricPreview metricFormat={metric.format} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent datasets */}
        <Panel
          title="Recent datasets"
          icon={FolderIcon}
          action={
            <Link to="/datasets" className="text-xs font-medium text-cyan-400 hover:underline">
              View all
            </Link>
          }
        >
          {data.recentDatasets.length === 0 ? (
            <EmptyState title="No datasets yet" description="Upload a dataset to start exploring." />
          ) : (
            <ul className="flex flex-col">
              {data.recentDatasets.map((dataset) => (
                <li
                  key={dataset.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/5 py-3 last:border-0 hover:bg-white/[0.02]"
                  onClick={() => navigate(`/datasets/${dataset.id}`)}
                >
                  <FolderIcon className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-sm font-medium text-white">{dataset.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {dataset.rowCount?.toLocaleString('en-US') ?? '—'} rows
                    </span>
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(dataset.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {deleteAnalysis.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {toApiError(deleteAnalysis.error).message}
        </p>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  to,
}: {
  label: string;
  value: string;
  sub: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20"
    >
      <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-3xl font-bold tabular-nums text-white">{value}</span>
      <span className="text-xs text-slate-500">{sub}</span>
    </Link>
  );
}

function Panel({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4 text-cyan-400" />
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function RunBadge({ status }: { status: 'SUCCESS' | 'FAILED' }) {
  return status === 'SUCCESS' ? (
    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
      Success
    </span>
  ) : (
    <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-300">
      Failed
    </span>
  );
}

function MetricPreview({ metricFormat }: { metricFormat: MetricFormat }) {
  return (
    <span className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-xs text-slate-400">
      {metricFormat}
    </span>
  );
}