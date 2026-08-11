import type { ComponentType, ReactNode } from 'react';
import { SkeletonKpiCard } from '../../../../components/ui/Skeleton';

interface KpiItem {
  label: string;
  value: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  hint?: ReactNode;
  tone?: 'default' | 'good' | 'warning' | 'bad' | 'accent';
}

interface DatasetKpiCardsProps {
  items: KpiItem[];
  loading?: boolean;
}

export function DatasetKpiCards({ items, loading }: DatasetKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: items.length || 6 }).map((_, index) => (
          <SkeletonKpiCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
            {item.icon ? <item.icon className="h-3.5 w-3.5" /> : null}
            {item.label}
          </dt>
          <dd className="mt-2 truncate text-2xl font-bold text-white" title={String(item.value)}>
            {item.value}
          </dd>
          {item.hint ? <div className="mt-1 text-xs text-slate-500">{item.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
