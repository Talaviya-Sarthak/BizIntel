import type { AISummary } from '../../analytics/types';
import { BrainIcon, CheckCircleIcon, AlertIcon, TrendingUpIcon } from '../../../../components/ui/icons';
import { Spinner } from '../../../../components/ui/Button';
import { ErrorState } from '../../../../components/ui/ErrorState';

interface AISummarySectionProps {
  datasetId: string;
  data?: AISummary;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

export function AISummarySection({
  data,
  loading,
  error,
  onRetry,
}: AISummarySectionProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner size="md" />
        <p className="text-sm text-slate-400">Generating AI summary...</p>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <BrainIcon className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-bold text-white">AI Summary</h2>
        <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-medium text-violet-400 ring-1 ring-violet-400/20">
          Auto-generated
        </span>
      </div>

      {/* Executive Summary */}
      <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400 ring-1 ring-violet-400/20">
            <BrainIcon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{data.executiveSummary}</p>
        <p className="mt-3 text-[10px] text-slate-500">
          Generated at: {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* Key Insights */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
            <TrendingUpIcon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-white">Key Insights</h3>
        </div>
        <div className="space-y-3">
          {data.keyInsights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-[10px] font-bold text-cyan-400">
                {idx + 1}
              </span>
              <p className="text-sm text-slate-300">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20">
            <CheckCircleIcon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-white">Recommendations</h3>
        </div>
        <div className="space-y-3">
          {data.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4"
            >
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <p className="text-sm text-slate-300">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risks */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20">
            <AlertIcon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-white">Potential Risks</h3>
        </div>
        <div className="space-y-3">
          {data.risks.map((risk, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-amber-400/10 bg-amber-400/5 p-4"
            >
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
              <p className="text-sm text-slate-300">{risk}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Analysis */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/10 text-violet-400 ring-1 ring-violet-400/20">
            <BrainIcon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-white">Suggested Next Analysis</h3>
        </div>
        <div className="space-y-2">
          {data.suggestedAnalysis.map((analysis, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-400/10 text-[10px] font-bold text-violet-400">
                {idx + 1}
              </span>
              <p className="text-sm text-slate-300">{analysis}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
