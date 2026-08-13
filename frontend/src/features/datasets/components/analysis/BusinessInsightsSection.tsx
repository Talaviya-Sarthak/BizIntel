import type { BusinessInsight } from '../../analytics/types';
import { SparklesIcon, TrendingUpIcon, AlertIcon, ChartIcon } from '../../../../components/ui/icons';
import { Spinner } from '../../../../components/ui/Button';
import { ErrorState } from '../../../../components/ui/ErrorState';

interface BusinessInsightsSectionProps {
  datasetId: string;
  data?: { insights: BusinessInsight[] };
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

export function BusinessInsightsSection({
  data,
  loading,
  error,
  onRetry,
}: BusinessInsightsSectionProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="md" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return null;

  const insights = data.insights;
  const highImpact = insights.filter((i) => i.impact === 'high');
  const mediumImpact = insights.filter((i) => i.impact === 'medium');
  const lowImpact = insights.filter((i) => i.impact === 'low');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <SparklesIcon className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-bold text-white">Business Insights</h2>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-400/10 text-red-400 ring-1 ring-red-400/20">
              <AlertIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">High Impact</p>
              <p className="text-xl font-bold text-white">{highImpact.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20">
              <TrendingUpIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Medium Impact</p>
              <p className="text-xl font-bold text-white">{mediumImpact.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
              <ChartIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Low Impact</p>
              <p className="text-xl font-bold text-white">{lowImpact.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* High Impact Insights */}
      {highImpact.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">High Impact Insights</h3>
          <div className="space-y-3">
            {highImpact.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Impact Insights */}
      {mediumImpact.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Medium Impact Insights</h3>
          <div className="space-y-3">
            {mediumImpact.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Low Impact Insights */}
      {lowImpact.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Additional Insights</h3>
          <div className="space-y-3">
            {lowImpact.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500">
          No business insights could be generated for this dataset.
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: BusinessInsight }) {
  const impactColors = {
    high: 'border-red-400/20 bg-red-400/5',
    medium: 'border-amber-400/20 bg-amber-400/5',
    low: 'border-cyan-400/20 bg-cyan-400/5',
  };

  const impactBadge = {
    high: 'bg-red-400/10 text-red-300 ring-red-400/30',
    medium: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
    low: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/30',
  };

  const typeIcons: Record<string, string> = {
    DATA_OVERVIEW: 'Dataset',
    NUMERIC_SUMMARY: 'Numeric',
    CATEGORY_DOMINANCE: 'Category',
    CORRELATION: 'Correlation',
  };

  return (
    <div className={`rounded-xl border p-4 ${impactColors[insight.impact]}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white">{insight.title}</span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ring-1 ${impactBadge[insight.impact]}`}>
              {insight.impact}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{insight.description}</p>
          {insight.metric && (
            <p className="mt-2 text-[10px] text-slate-500">
              Metric: <span className="font-medium text-slate-400">{insight.metric}</span>
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium text-slate-400">
          {typeIcons[insight.type] ?? insight.type}
        </span>
      </div>
    </div>
  );
}
