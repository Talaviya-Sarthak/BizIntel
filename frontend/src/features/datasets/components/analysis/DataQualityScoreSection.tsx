import type { DatasetQuality } from '../../analytics/types';
import { CheckCircleIcon } from '../../../../components/ui/icons';
import { Spinner } from '../../../../components/ui/Button';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { formatNumber } from '../../../../utils/format';

interface DataQualityScoreSectionProps {
  datasetId: string;
  quality?: DatasetQuality;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

export function DataQualityScoreSection({
  quality,
  loading,
  error,
  onRetry,
}: DataQualityScoreSectionProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="md" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!quality) return null;

  const score = quality.healthScore;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return '#22d3ee';
    if (score >= 60) return '#fbbf24';
    return '#fb7185';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Data Quality Score</h2>
      </div>

      {/* Score Ring */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 100 100" className="-rotate-90">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            {/* Score arc */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getScoreColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: getScoreColor() }}>
              {score}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
            <span className="mt-1 text-sm font-medium text-slate-300">{getScoreLabel()}</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Score Breakdown</h3>
        <div className="space-y-4">
          <ScoreFactor
            label="Missing Values"
            penalty={quality.missingPercent}
            maxPenalty={100}
            detail={`${formatNumber(quality.missingValues)} cells (${quality.missingPercent.toFixed(1)}%)`}
          />
          <ScoreFactor
            label="Duplicate Rows"
            penalty={quality.duplicatePercent * 1.5}
            maxPenalty={100}
            detail={`${formatNumber(quality.duplicateRows)} rows (${quality.duplicatePercent.toFixed(1)}%)`}
          />
          <ScoreFactor
            label="Invalid Values"
            penalty={quality.invalidPercent}
            maxPenalty={100}
            detail={`${formatNumber(quality.invalidValues)} cells (${quality.invalidPercent.toFixed(1)}%)`}
          />
          <ScoreFactor
            label="Type Consistency"
            penalty={100 - quality.typeConsistency}
            maxPenalty={100}
            detail={`${quality.typeConsistency.toFixed(0)}% consistent`}
            invert
          />
        </div>
      </div>

      {/* Health Reasons */}
      {quality.reasons.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Quality Assessment</h3>
          <div className="space-y-3">
            {quality.reasons.map((reason, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-xl p-4 ${
                  reason.level === 'good'
                    ? 'bg-emerald-400/5 border border-emerald-400/20'
                    : 'bg-amber-400/5 border border-amber-400/20'
                }`}
              >
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  reason.level === 'good' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    reason.level === 'good' ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {reason.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{reason.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Quality Details */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Column Quality Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5 font-medium">Column</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium text-right">Missing</th>
                <th className="px-3 py-2.5 font-medium text-right">Unique</th>
                <th className="px-3 py-2.5 font-medium text-right">Invalid</th>
                <th className="px-3 py-2.5 font-medium text-right">Quality</th>
              </tr>
            </thead>
            <tbody>
              {quality.columns.map((col) => (
                <tr
                  key={col.column}
                  className="border-b border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2.5 font-medium text-white">{col.column}</td>
                  <td className="px-3 py-2.5 text-slate-400">{col.type}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{formatNumber(col.missing)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{formatNumber(col.unique)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{formatNumber(col.invalid)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${getQualityColor(col.quality)}`}>
                      {col.quality}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScoreFactor({
  label,
  penalty,
  maxPenalty,
  detail,
  invert = false,
}: {
  label: string;
  penalty: number;
  maxPenalty: number;
  detail: string;
  invert?: boolean;
}) {
  const normalizedPenalty = Math.min(100, (penalty / maxPenalty) * 100);
  const quality = invert
    ? normalizedPenalty < 10
      ? 'good'
      : normalizedPenalty < 30
      ? 'warning'
      : 'bad'
    : normalizedPenalty < 5
    ? 'good'
    : normalizedPenalty < 20
    ? 'warning'
    : 'bad';

  const colors = {
    good: 'bg-emerald-400',
    warning: 'bg-amber-400',
    bad: 'bg-red-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-xs text-slate-500">{detail}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${colors[quality]}`}
          style={{ width: `${Math.min(100, 100 - normalizedPenalty)}%` }}
        />
      </div>
    </div>
  );
}

function getQualityColor(quality: string): string {
  switch (quality) {
    case 'Excellent':
      return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30';
    case 'Good':
      return 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/30';
    case 'Fair':
      return 'bg-amber-400/10 text-amber-300 ring-amber-400/30';
    case 'Poor':
      return 'bg-red-400/10 text-red-300 ring-red-400/30';
    default:
      return 'bg-slate-400/10 text-slate-300 ring-slate-400/30';
  }
}
