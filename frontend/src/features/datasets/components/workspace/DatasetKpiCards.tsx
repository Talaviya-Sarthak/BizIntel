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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6 bg-black">
        {Array.from({ length: items.length || 6 }).map((_, index) => (
          <SkeletonKpiCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6 bg-black">
      {items.map((item) => (
        <div
          key={item.label}
          className="border-2 border-white bg-ink-card p-4 shadow-brutal-sm rounded-md"
        >
          <dt className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted">
            {item.icon ? <item.icon className="h-4 w-4 text-white" /> : null}
            {item.label}
          </dt>
          <dd className="mt-2 truncate text-xl font-black uppercase text-white" title={String(item.value)}>
            {item.value}
          </dd>
          {item.hint ? <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">{item.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
