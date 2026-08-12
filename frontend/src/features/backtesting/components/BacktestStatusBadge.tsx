import { clsx } from 'clsx';
import type { BacktestStatus } from '../types';

const STYLES: Record<BacktestStatus, { label: string; dot: string; text: string; ring: string }> = {
  PENDING: { label: 'Pending', dot: 'bg-zinc-400', text: 'text-zinc-300', ring: 'ring-zinc-400/20' },
  RUNNING: { label: 'Running', dot: 'bg-zinc-200', text: 'text-zinc-100', ring: 'ring-white/20' },
  COMPLETED: { label: 'Completed', dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/20' },
  FAILED: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-300', ring: 'ring-red-400/20' },
};

const RUNNING = new Set<BacktestStatus>(['PENDING', 'RUNNING']);

export function BacktestStatusBadge({ status }: { status: BacktestStatus }) {
  const style = STYLES[status] ?? STYLES.PENDING;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium border border-white/[0.08] bg-zinc-900',
        style.text,
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
