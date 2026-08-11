import { clsx } from 'clsx';
import { CheckCircleIcon, InfoIcon, AlertIcon } from '../../../../components/ui/icons';
import type { DatasetQuality } from '../../analytics/types';

interface DatasetHealthProps {
  quality: DatasetQuality;
}

function scoreTone(score: number): { label: string; color: string; ring: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-300', ring: '#34d399' };
  if (score >= 75) return { label: 'Good', color: 'text-cyan-300', ring: '#22d3ee' };
  if (score >= 60) return { label: 'Fair', color: 'text-amber-300', ring: '#fbbf24' };
  return { label: 'Poor', color: 'text-red-300', ring: '#fb7185' };
}

/** Overall dataset health: score ring + per-dimension reasons. */
export function DatasetHealth({ quality }: DatasetHealthProps) {
  const tone = scoreTone(quality.healthScore);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = (quality.healthScore / 100) * circumference;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Dataset health</h3>
        <span className={clsx('text-xs font-semibold', tone.color)}>{tone.label}</span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0" role="img" aria-label={`Health score ${quality.healthScore} out of 100`}>
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={tone.ring}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{quality.healthScore}</span>
            <span className="text-[11px] text-slate-500">/ 100</span>
          </div>
        </div>

        <ul className="grid w-full gap-2">
          {quality.reasons.map((reason) => (
            <li
              key={reason.title}
              className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] px-3 py-2"
            >
              {reason.level === 'good' ? (
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              )}
              <div>
                <p className="text-sm font-medium text-white">{reason.title}</p>
                <p className="text-xs leading-relaxed text-slate-400">{reason.detail}</p>
              </div>
            </li>
          ))}
          {quality.reasons.length === 0 ? (
            <li className="flex items-center gap-2 text-sm text-slate-400">
              <InfoIcon className="h-4 w-4 text-slate-500" />
              No issues detected.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
