import type { ComponentType } from 'react';
import { clsx } from 'clsx';

type Accent = 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';

const ACCENTS: Record<Accent, { icon: string; value: string; label: string }> = {
  cyan: { icon: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20', value: 'text-cyan-300', label: 'text-slate-400' },
  emerald: { icon: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20', value: 'text-emerald-300', label: 'text-slate-400' },
  amber: { icon: 'bg-amber-400/10 text-amber-300 ring-amber-400/20', value: 'text-amber-300', label: 'text-slate-400' },
  violet: { icon: 'bg-violet-400/10 text-violet-300 ring-violet-400/20', value: 'text-violet-300', label: 'text-slate-400' },
  rose: { icon: 'bg-rose-400/10 text-rose-300 ring-rose-400/20', value: 'text-rose-300', label: 'text-slate-400' },
  slate: { icon: 'bg-white/5 text-slate-300 ring-white/10', value: 'text-white', label: 'text-slate-400' },
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className={clsx('inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1', styles.icon)}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <p className={clsx('text-[11px] font-medium uppercase tracking-wider', styles.label)}>{label}</p>
      </div>
      <p className={clsx('mt-2 truncate text-xl font-bold tracking-tight', styles.value)}>
        {value ?? '—'}
      </p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-slate-600">{hint}</p> : null}
    </div>
  );
}
