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
      className="sticky top-0 z-10 -mx-5 overflow-x-auto border-b-2 border-white bg-black px-5 py-0 sm:-mx-8 sm:px-8"
      aria-label="Dataset workspace tabs"
    >
      <div className="flex gap-1.5">
        {TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              aria-current={selected ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-2 whitespace-nowrap border-b-3 px-3 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 outline-none',
                selected
                  ? 'border-lime text-lime font-black'
                  : 'border-transparent text-muted hover:border-white/30 hover:text-white',
              )}
            >
              <tab.icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
