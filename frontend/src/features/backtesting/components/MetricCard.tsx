import type { ComponentType } from 'react';
import { clsx } from 'clsx';

type Accent = 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';

const ACCENTS: Record<Accent, { icon: string; value: string; label: string }> = {
  cyan: { icon: 'bg-zinc-800 text-zinc-100 border border-zinc-700/60', value: 'text-zinc-100', label: 'text-zinc-400' },
  emerald: { icon: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40', value: 'text-emerald-400', label: 'text-zinc-400' },
  amber: { icon: 'bg-amber-950/60 text-amber-400 border border-amber-800/40', value: 'text-amber-400', label: 'text-zinc-400' },
  violet: { icon: 'bg-zinc-800 text-zinc-100 border border-zinc-700/60', value: 'text-zinc-100', label: 'text-zinc-400' },
  rose: { icon: 'bg-rose-950/60 text-rose-400 border border-rose-800/40', value: 'text-rose-400', label: 'text-zinc-400' },
  slate: { icon: 'bg-zinc-800 text-zinc-100 border border-zinc-700/60', value: 'text-zinc-100', label: 'text-zinc-400' },
};

interface MetricCardProps {
  label: string;
  value: string | null;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  accent?: Accent;
}

/** Compact KPI card used across the backtest result dashboard. */
export function MetricCard({ label, value, hint, icon: Icon, accent = 'slate' }: MetricCardProps) {
  const styles = ACCENTS[accent];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#181818] p-3.5 shadow-sm">
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className={clsx('inline-flex h-7 w-7 items-center justify-center rounded-lg shadow-xs', styles.icon)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <p className={clsx('text-[10.5px] font-semibold uppercase tracking-wider', styles.label)}>{label}</p>
      </div>
      <p className={clsx('mt-2 truncate text-xl font-bold tracking-tight font-mono', styles.value)}>
        {value ?? '—'}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[10.5px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}
