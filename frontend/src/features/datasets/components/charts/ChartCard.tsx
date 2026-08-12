import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { SkeletonChart } from '../../../../components/ui/Skeleton';
import type { ChartIconType } from './chartShared';

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: ChartIconType;
  actions?: ReactNode;
  isLoading?: boolean;
  /** Human-readable error message (already normalized). */
  error?: string | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Standard panel wrapper for every analytical block. Centralizes the loading,
 * error and empty states so individual analyses fail without breaking the rest
 * of the dataset workspace.
 */
export function ChartCard({
  title,
  description,
  icon: Icon,
  actions,
  isLoading = false,
  error,
  onRetry,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  children,
  className,
}: ChartCardProps) {
  return (
    <section
      className={clsx(
        'flex flex-col border-2 border-white bg-ink-card p-5 shadow-brutal rounded-md',
        className,
      )}
      aria-label={title}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b-2 border-white pb-3">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-2 border-lime bg-lime/10 text-lime rounded-sm">
              <Icon className="h-4.5 w-4.5" />
            </span>
          ) : null}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="flex-1">
        {isLoading ? (
          <SkeletonChart />
        ) : error ? (
          <ErrorState
            title="Analysis unavailable"
            message={error}
            onRetry={onRetry}
            className="py-8"
          />
        ) : isEmpty ? (
          <EmptyState
            title={emptyTitle ?? 'No data to display'}
            description={emptyDescription}
            className="py-8"
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
