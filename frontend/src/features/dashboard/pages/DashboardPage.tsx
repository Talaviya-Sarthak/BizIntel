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
    <div className="flex flex-col gap-8 bg-black">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-muted">
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
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            Recent datasets
          </h2>
          {summaryQuery.data ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
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
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">
          Quick actions
        </h2>
        <QuickActions />
      </section>

      <section aria-label="Module status">
        <div className="border-2 border-white bg-ink-card p-6 shadow-brutal rounded-md">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <SparklesIcon className="h-4.5 w-4.5 text-lime" />
            Platform roadmap
          </p>
          <p className="mt-2.5 text-xs font-semibold leading-relaxed text-muted uppercase tracking-wider">
            Datasets are the shared foundation for everything that follows. DataMart
            Analytics, Backtesting, and the AI Assistant will all consume the datasets you
            upload here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['DataMart Analytics', 'Backtesting', 'AI Assistant'].map((module) => (
              <span
                key={module}
                className="border border-white bg-black px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted rounded-sm"
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
