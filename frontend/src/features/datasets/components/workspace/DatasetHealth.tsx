import { clsx } from 'clsx';
import { CheckCircleIcon, InfoIcon, AlertIcon } from '../../../../components/ui/icons';
import type { DatasetQuality } from '../../analytics/types';

interface DatasetHealthProps {
  quality: DatasetQuality;
}

function scoreTone(score: number): { label: string; textClass: string; color: string } {
  if (score >= 90) return { label: 'Excellent', textClass: 'text-lime', color: '#C6FF00' };
  if (score >= 75) return { label: 'Good', textClass: 'text-lime', color: '#C6FF00' };
  if (score >= 60) return { label: 'Fair', textClass: 'text-yellow', color: '#FFD600' };
  return { label: 'Poor', textClass: 'text-pink', color: '#FF4D8D' };
}

/** Overall dataset health: score ring + per-dimension reasons. */
export function DatasetHealth({ quality }: DatasetHealthProps) {
  const tone = scoreTone(quality.healthScore);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = (quality.healthScore / 100) * circumference;

  return (
    <div className="border-2 border-white bg-ink-card p-5 shadow-brutal rounded-md">
      <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Dataset health</h3>
        <span className={clsx('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-2 rounded-sm', tone.textClass, tone.textClass === 'text-lime' ? 'border-lime bg-lime/10' : tone.textClass === 'text-yellow' ? 'border-yellow bg-yellow/10' : 'border-pink bg-pink/10')}>{tone.label}</span>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative h-28 w-28 shrink-0 bg-black border-2 border-white rounded-md p-1.5 flex items-center justify-center" role="img" aria-label={`Health score ${quality.healthScore} out of 100`}>
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={tone.color}
              strokeWidth="10"
              strokeLinecap="square"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{quality.healthScore}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted">/ 100</span>
          </div>
        </div>

        <ul className="grid w-full gap-2">
          {quality.reasons.map((reason) => (
            <li
              key={reason.title}
              className="flex items-start gap-3 border border-white/20 bg-black px-3 py-2.5 rounded-sm"
            >
              {reason.level === 'good' ? (
                <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
              ) : (
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-pink" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white">{reason.title}</p>
                <p className="text-xs leading-relaxed text-muted font-medium mt-0.5">{reason.detail}</p>
              </div>
            </li>
          ))}
          {quality.reasons.length === 0 ? (
            <li className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted px-3 py-2.5">
              <InfoIcon className="h-4.5 w-4.5 text-muted" />
              No issues detected.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
