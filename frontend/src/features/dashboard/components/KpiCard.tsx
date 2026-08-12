import { clsx } from 'clsx';
import type { ComponentType } from 'react';

const ACCENTS = {
  cyan: 'bg-lime/10 text-lime border-2 border-lime',
  emerald: 'bg-lime/10 text-lime border-2 border-lime',
  amber: 'bg-yellow/10 text-yellow border-2 border-yellow',
  violet: 'bg-pink/10 text-pink border-2 border-pink',
} as const;

interface KpiCardProps {
  label: string;
  /** Real value from the backend, or `null` when the metric is coming soon. */
  value?: string | number | null;
  icon: ComponentType<{ className?: string }>;
  accent?: keyof typeof ACCENTS;
  hint?: string;
}

export function KpiCard({ label, value, icon: Icon, accent = 'cyan', hint }: KpiCardProps) {
  const comingSoon = value === null || value === undefined;

  return (
    <div className="border-2 border-white bg-ink-card p-5 rounded-md shadow-brutal flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span
            className={clsx(
              'inline-flex h-10 w-10 items-center justify-center rounded-sm',
              ACCENTS[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          {comingSoon ? (
            <span className="rounded-sm border border-yellow bg-yellow/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow">
              Coming soon
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-3xl font-black uppercase tracking-tight text-white">
          {comingSoon ? '—' : value}
        </p>
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          {label}
        </p>
      </div>
      {hint ? <p className="mt-2 text-xs font-bold text-muted uppercase tracking-wider">{hint}</p> : null}
    </div>
  );
}
