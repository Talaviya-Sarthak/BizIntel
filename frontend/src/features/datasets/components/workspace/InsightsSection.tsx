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
      return 'bg-lime/10 text-lime border-2 border-lime';
    case 'INFO':
      return 'bg-white/10 text-white border-2 border-white';
    case 'LOW':
      return 'bg-white/5 text-muted border-2 border-white/30';
    case 'WARNING':
      return 'bg-yellow/10 text-yellow border-2 border-yellow';
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
      <ul className="flex flex-col gap-4">
        {insights.map((insight, index) => {
          const Icon = TYPE_ICON[insight.type] ?? InfoIcon;
          return (
            <li
              key={`${insight.title}-${index}`}
              className="border-2 border-white bg-black p-4 rounded-md shadow-brutal-sm"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-2 border-lime bg-lime/10 text-lime rounded-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="text-sm font-black uppercase tracking-wider text-white">{insight.title}</p>
                    <span
                      className={clsx(
                        'rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-2',
                        severityClasses(insight.severity),
                      )}
                    >
                      {insight.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-muted uppercase tracking-wider">
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
