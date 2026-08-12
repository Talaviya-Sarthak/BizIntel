import { clsx } from 'clsx';
import type { ComponentType } from 'react';
import { ChartCard } from '../charts/ChartCard';
import {
  ActivityIcon,
  ChartIcon,
  SparklesIcon,
  TrendingUpIcon,
  InfoIcon,
} from '../../../../components/ui/icons';
import { useDatasetInsights } from '../../hooks/useDatasetAnalytics';
import type { InsightSeverity, InsightType } from '../../analytics/types';

const TYPE_ICON: Record<InsightType, ComponentType<{ className?: string }>> = {
  DATA_QUALITY: ActivityIcon,
  TREND: TrendingUpIcon,
  CORRELATION: ChartIcon,
  OUTLIER: TrendingUpIcon,
  DISTRIBUTION: ChartIcon,
  CATEGORY: SparklesIcon,
};

function severityClasses(severity: InsightSeverity): string {
  switch (severity) {
    case 'GOOD':
      return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40';
    case 'INFO':
      return 'bg-zinc-800 text-zinc-200 border border-zinc-700/60';
    case 'LOW':
      return 'bg-zinc-900 text-zinc-400 border border-zinc-800';
    case 'WARNING':
      return 'bg-amber-950/60 text-amber-400 border border-amber-800/40';
  }
}

interface InsightsSectionProps {
  datasetId: string;
}

export function InsightsSection({ datasetId }: InsightsSectionProps) {
  const insightsQuery = useDatasetInsights(datasetId);
  const insights = insightsQuery.data?.insights ?? [];

  return (
    <ChartCard
      title="Automated insights"
      description="What stands out in this dataset"
      isLoading={insightsQuery.isLoading}
      error={insightsQuery.error ? insightsQuery.error.message : null}
      onRetry={() => insightsQuery.refetch()}
      isEmpty={insights.length === 0}
      emptyTitle="No insights found"
      emptyDescription="Nothing noteworthy detected in this dataset yet."
    >
      <ul className="flex flex-col gap-3">
        {insights.map((insight, index) => {
          const Icon = TYPE_ICON[insight.type] ?? InfoIcon;
          return (
            <li
              key={`${insight.title}-${index}`}
              className="rounded-lg border border-white/[0.04] bg-zinc-900/60 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-zinc-100">{insight.title}</p>
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider',
                        severityClasses(insight.severity),
                      )}
                    >
                      {insight.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {insight.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
}
