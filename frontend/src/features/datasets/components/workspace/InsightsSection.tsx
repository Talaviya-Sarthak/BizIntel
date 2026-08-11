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
      return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30';
    case 'INFO':
      return 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/30';
    case 'LOW':
      return 'bg-slate-400/10 text-slate-300 ring-slate-400/30';
    case 'WARNING':
      return 'bg-amber-400/10 text-amber-300 ring-amber-400/30';
  }
}

interface InsightsSectionProps {
  datasetId: string;
}

/** Auto-generated findings about the dataset. */
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
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-cyan-400 ring-1 ring-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{insight.title}</p>
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                        severityClasses(insight.severity),
                      )}
                    >
                      {insight.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
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
