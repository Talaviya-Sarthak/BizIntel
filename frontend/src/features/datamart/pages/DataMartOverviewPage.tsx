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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        title="DataMart Engine"
        description="Explore, analyze and visualize your enterprise datasets without SQL. Build a query, save it, and arrange live results on dashboards."
        actions={
          <Button variant="primary" onClick={() => navigate('/datamart/query')} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs border border-white/20">
            <PlusIcon className="h-3.5 w-3.5" />
            New query
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent runs */}
        <Panel
          title="Recent execution runs"
          icon={PlayIcon}
          action={
            <Link to="/datamart/analyses" className="text-xs font-semibold text-zinc-300 hover:text-white hover:underline transition-colors">
              View all
            </Link>
          }
        >
          {data.recentRuns.length === 0 ? (
            <EmptyState title="No runs recorded yet" description="Run a query to see its execution history here." />
          ) : (
            <ul className="flex flex-col">
              {data.recentRuns.slice(0, 5).map((run) => (
                <li
                  key={run.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/[0.04] py-3 last:border-0 hover:bg-white/[0.02] transition-colors"
                  onClick={() => navigate(`/datamart/analyses/${run.analysisId}`)}
                >
                  <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-xs font-semibold text-zinc-100">{run.analysisName}</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-400">
                      {formatDate(run.createdAt)}
                    </span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">{run.executionTimeMs} ms</span>
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
            <Link to="/datamart/analyses" className="text-xs font-semibold text-zinc-300 hover:text-white hover:underline transition-colors">
              View all
            </Link>
          }
        >
          {recentAnalyses.length === 0 ? (
            <EmptyState
              title="No analyses saved yet"
              description="Build and save your first query to see it listed here."
              action={
                <Button size="sm" onClick={() => navigate('/datamart/query')} className="bg-white text-black font-semibold text-xs hover:bg-zinc-200">
                  <PlusIcon className="h-3.5 w-3.5" />
                  New query
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col">
              {recentAnalyses.map((analysis) => (
                <li
                  key={analysis.id}
                  className="cursor-pointer border-b border-white/[0.04] py-3 last:border-0 hover:bg-white/[0.02] transition-colors"
                  onClick={() => navigate(`/datamart/analyses/${analysis.id}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-semibold text-zinc-100">{analysis.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Run analysis"
                      className="text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                      onClick={(event) => {
                        event.stopPropagation();
                        void executeAnalysis.mutateAsync(analysis.id);
                      }}
                    >
                      <PlayIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
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
            <Link to="/datamart/metrics" className="text-xs font-semibold text-zinc-300 hover:text-white hover:underline transition-colors">
              View all
            </Link>
          }
        >
          {recentMetrics.length === 0 ? (
            <EmptyState
              title="No metrics defined yet"
              description="Promote a query to a reusable metric KPI to see it listed here."
            />
          ) : (
            <ul className="flex flex-col">
              {recentMetrics.map((metric) => (
                <li
                  key={metric.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/[0.04] py-3 last:border-0 hover:bg-white/[0.02] transition-colors"
                  onClick={() => navigate('/datamart/metrics')}
                >
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-xs font-semibold text-zinc-100">{metric.name}</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-400">
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
            <Link to="/datasets" className="text-xs font-semibold text-zinc-300 hover:text-white hover:underline transition-colors">
              View all
            </Link>
          }
        >
          {data.recentDatasets.length === 0 ? (
            <EmptyState title="No datasets uploaded yet" description="Upload a dataset to start exploring schemas and queries." />
          ) : (
            <ul className="flex flex-col">
              {data.recentDatasets.map((dataset) => (
                <li
                  key={dataset.id}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/[0.04] py-3 last:border-0 hover:bg-white/[0.02] transition-colors"
                  onClick={() => navigate(`/datasets/${dataset.id}`)}
                >
                  <FolderIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-xs font-semibold text-zinc-100">{dataset.name}</span>
                    <span className="mt-0.5 block text-[11px] text-zinc-400 font-mono">
                      {dataset.rowCount?.toLocaleString('en-US') ?? '—'} rows
                    </span>
                  </span>
                  <span className="text-[11px] text-zinc-400">{formatDate(dataset.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {deleteAnalysis.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
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
      className="group flex flex-col gap-1 rounded-xl border border-white/[0.06] bg-[#181818] p-4 shadow-sm transition hover:border-white/20"
    >
      <span className="text-[10.5px] uppercase font-semibold tracking-wider text-zinc-400">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-zinc-100 font-mono">{value}</span>
      <span className="text-[11px] text-zinc-400">{sub}</span>
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
    <section className="flex flex-col rounded-xl border border-white/[0.06] bg-[#181818] p-4 sm:p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/[0.06] pb-2.5">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-zinc-100">
          <Icon className="h-3.5 w-3.5 text-zinc-300" />
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
    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-emerald-300">
      Success
    </span>
  ) : (
    <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-red-300">
      Failed
    </span>
  );
}

function MetricPreview({ metricFormat }: { metricFormat: MetricFormat }) {
  return (
    <span className="rounded border border-white/[0.08] bg-zinc-900 px-2 py-0.5 text-[10.5px] text-zinc-400 font-mono">
      {metricFormat}
    </span>
  );
}