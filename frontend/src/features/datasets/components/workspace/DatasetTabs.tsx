import { clsx } from 'clsx';
import type { ComponentType } from 'react';
import {
  ActivityIcon,
  ChartIcon,
  ColumnsIcon,
  DatabaseIcon,
  SparklesIcon,
  TrendingUpIcon,
} from '../../../../components/ui/icons';

export type DatasetTabKey = 'overview' | 'columns' | 'explore' | 'charts' | 'insights' | 'quality';

interface TabDef {
  key: DatasetTabKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const TABS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: DatabaseIcon },
  { key: 'columns', label: 'Columns', icon: ColumnsIcon },
  { key: 'explore', label: 'Explore data', icon: TrendingUpIcon },
  { key: 'charts', label: 'Charts', icon: ChartIcon },
  { key: 'insights', label: 'Insights', icon: SparklesIcon },
  { key: 'quality', label: 'Data quality', icon: ActivityIcon },
];

interface DatasetTabsProps {
  active: DatasetTabKey;
  onChange: (tab: DatasetTabKey) => void;
}

export function DatasetTabs({ active, onChange }: DatasetTabsProps) {
  return (
    <nav
      className="overflow-x-auto border-b border-white/[0.06] bg-transparent py-0"
      aria-label="Dataset workspace tabs"
    >
      <div className="flex gap-1">
        {TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              aria-current={selected ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-all',
                selected
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:border-white/20 hover:text-zinc-200',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
