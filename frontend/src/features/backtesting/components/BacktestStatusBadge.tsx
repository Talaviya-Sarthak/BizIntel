import { clsx } from 'clsx';
import type { BacktestStatus } from '../types';

const STYLES: Record<BacktestStatus, { label: string; dot: string; text: string; ring: string }> = {
  PENDING: { label: 'Pending', dot: 'bg-slate-400', text: 'text-slate-300', ring: 'ring-slate-400/20' },
  RUNNING: { label: 'Running', dot: 'bg-cyan-400', text: 'text-cyan-300', ring: 'ring-cyan-400/20' },
  COMPLETED: { label: 'Completed', dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/20' },
  FAILED: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-300', ring: 'ring-red-400/20' },
};

const RUNNING = new Set<BacktestStatus>(['PENDING', 'RUNNING']);

export function BacktestStatusBadge({ status }: { status: BacktestStatus }) {
  const style = STYLES[status] ?? STYLES.PENDING;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        style.text,
        style.ring,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {RUNNING.has(status) ? (
          <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', style.dot)} />
        ) : null}
        <span className={clsx('relative inline-flex h-1.5 w-1.5 rounded-full', style.dot)} />
      </span>
      {style.label}
    </span>
  );
}
