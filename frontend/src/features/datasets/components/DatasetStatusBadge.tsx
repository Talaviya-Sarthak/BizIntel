import { clsx } from 'clsx';
import type { DatasetStatus } from '../types';
import { DATASET_STATUSES } from '../types';

const STATUS_STYLES: Record<DatasetStatus, { label: string; bg: string; border: string; text: string; dot: string }> = {
  UPLOADING: { label: 'Uploading', bg: 'bg-yellow/10', border: 'border-yellow', text: 'text-yellow', dot: 'bg-yellow' },
  VALIDATING: { label: 'Validating', bg: 'bg-yellow/10', border: 'border-yellow', text: 'text-yellow', dot: 'bg-yellow' },
  PROCESSING: { label: 'Processing', bg: 'bg-yellow/10', border: 'border-yellow', text: 'text-yellow', dot: 'bg-yellow' },
  READY: { label: 'Ready', bg: 'bg-lime/10', border: 'border-lime', text: 'text-lime', dot: 'bg-lime' },
  FAILED: { label: 'Failed', bg: 'bg-pink/10', border: 'border-pink', text: 'text-pink', dot: 'bg-pink' },
  DELETED: { label: 'Deleted', bg: 'bg-white/5', border: 'border-white/30', text: 'text-muted', dot: 'bg-muted' },
};

const RUNNING = new Set<DatasetStatus>(['UPLOADING', 'VALIDATING', 'PROCESSING']);

export function DatasetStatusBadge({ status }: { status: DatasetStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES[DATASET_STATUSES[0]!];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 border-2 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm',
        style.bg,
        style.border,
        style.text,
      )}
    >
      <span className={clsx('relative flex h-1.5 w-1.5')}>
        {RUNNING.has(status) ? (
          <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-sm opacity-60', style.dot)} />
        ) : null}
        <span className={clsx('relative inline-flex h-1.5 w-1.5 rounded-sm', style.dot)} />
      </span>
      {style.label}
    </span>
  );
}
