import { ErrorState } from '../../../components/ui/ErrorState';
import {
  DatabaseIcon,
  MessageIcon,
  SparklesIcon,
  TrendingUpIcon,
} from '../../../components/ui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError } from '../../../lib/api';
import { formatNumber } from '../../../utils/format';
import { KpiCard } from '../components/KpiCard';
import { QuickActions } from '../components/QuickActions';
import { RecentDatasets } from '../components/RecentDatasets';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

/** Salutation derived from the local clock. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const summaryQuery = useDashboardSummary();

  const firstName = user?.name?.split(/\s+/)[0] ?? 'there';

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
          Here&apos;s an overview of your intelligence workspace.
        </p>
      </header>

      {summaryQuery.isError ? (
        <ErrorState
          title="Could not load your dashboard"
          message={toApiError(summaryQuery.error).message}
          onRetry={() => summaryQuery.refetch()}
        />
      ) : null}

      <section aria-label="Key metrics">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Datasets"
            value={summaryQuery.data ? formatNumber(summaryQuery.data.datasets.total) : null}
            icon={DatabaseIcon}
            accent="cyan"
            hint={summaryQuery.isLoading ? 'Loading…' : 'In your registry'}
          />
          <KpiCard
            label="Total Analysis Runs"
            value={null}
            icon={DatabaseIcon}
            accent="emerald"
          />
          <KpiCard label="Backtests" value={null} icon={TrendingUpIcon} accent="amber" />
          <KpiCard label="AI Conversations" value={null} icon={MessageIcon} accent="violet" />
        </div>
      </section>

      <section aria-label="Recent datasets">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Recent datasets
          </h2>
          {summaryQuery.data ? (
            <span className="text-xs text-slate-500">
              {formatNumber(summaryQuery.data.datasets.byStatus.READY)} ready ·{' '}
              {formatNumber(summaryQuery.data.datasets.byStatus.FAILED)} failed
            </span>
          ) : null}
        </div>
        <RecentDatasets
          datasets={summaryQuery.data?.recentDatasets}
          isLoading={summaryQuery.isLoading}
        />
      </section>

      <section aria-label="Quick actions">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Quick actions
        </h2>
        <QuickActions />
      </section>

      <section aria-label="Module status">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <SparklesIcon className="h-4 w-4 text-cyan-400" />
            Platform roadmap
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Datasets are the shared foundation for everything that follows. DataMart
            Analytics, Backtesting, and the AI Assistant will all consume the datasets you
            upload here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['DataMart Analytics', 'Backtesting', 'AI Assistant'].map((module) => (
              <span
                key={module}
                className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wider text-slate-500"
              >
                {module} · coming soon
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
