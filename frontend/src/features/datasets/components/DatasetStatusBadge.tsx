import { clsx } from 'clsx';
import type { DatasetStatus } from '../types';
import { DATASET_STATUSES } from '../types';

const STATUS_STYLES: Record<DatasetStatus, { label: string; dot: string; text: string; ring: string }> = {
  UPLOADING: { label: 'Uploading', dot: 'bg-slate-400', text: 'text-slate-300', ring: 'ring-slate-400/20' },
  VALIDATING: { label: 'Validating', dot: 'bg-amber-400', text: 'text-amber-300', ring: 'ring-amber-400/20' },
  PROCESSING: { label: 'Processing', dot: 'bg-cyan-400', text: 'text-cyan-300', ring: 'ring-cyan-400/20' },
  READY: { label: 'Ready', dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/20' },
  FAILED: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-300', ring: 'ring-red-400/20' },
  DELETED: { label: 'Deleted', dot: 'bg-slate-500', text: 'text-slate-400', ring: 'ring-slate-500/20' },
};

const RUNNING = new Set<DatasetStatus>(['UPLOADING', 'VALIDATING', 'PROCESSING']);

export function DatasetStatusBadge({ status }: { status: DatasetStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES[DATASET_STATUSES[0]!];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
        style.text,
        style.ring,
      )}
    >
      <span className={clsx('relative flex h-1.5 w-1.5')}>
        {RUNNING.has(status) ? (
          <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', style.dot)} />
        ) : null}
        <span className={clsx('relative inline-flex h-1.5 w-1.5 rounded-full', style.dot)} />
      </span>
      {style.label}
    </span>
  );
}
