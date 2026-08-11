import { clsx } from 'clsx';
import type { ComponentType } from 'react';

const ACCENTS = {
  cyan: 'bg-cyan-400/10 text-cyan-400 ring-cyan-400/20',
  emerald: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/20',
  amber: 'bg-amber-400/10 text-amber-400 ring-amber-400/20',
  violet: 'bg-violet-400/10 text-violet-400 ring-violet-400/20',
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <span
          className={clsx(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1',
            ACCENTS[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {comingSoon ? (
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
            Coming soon
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-white">
        {comingSoon ? '—' : value}
      </p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
