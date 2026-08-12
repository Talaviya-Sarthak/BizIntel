import { clsx } from 'clsx';

/** Skeleton loading block. Used by every analytical component's loading state. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx('animate-pulse bg-ink-raised border border-white/20', className)}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a KPI-style card. */
export function SkeletonKpiCard() {
  return (
    <div className="border-2 border-white bg-ink-card p-5 rounded-md shadow-brutal-sm">
      <Skeleton className="h-10 w-10" />
      <Skeleton className="mt-4 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  );
}

/** Skeleton for a chart panel (header + tall body). */
export function SkeletonChart() {
  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Skeleton table body. */
export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={index} className="h-5 w-1/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
      <div className="flex justify-end gap-2 pt-1">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}
