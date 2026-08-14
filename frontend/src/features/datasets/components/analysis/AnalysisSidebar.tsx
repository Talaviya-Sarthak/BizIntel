import { clsx } from 'clsx';
import type { ComponentType } from 'react';
import type { AnalyticsColumn } from '../../analytics/types';
import {
  DatabaseIcon,
  ChartIcon,
  HashIcon,
  AlertIcon,
  TrendingUpIcon,
  LayersIcon,
  CheckCircleIcon,
  SparklesIcon,
  BrainIcon,
  DownloadIcon,
} from '../../../../components/ui/icons';

export type AnalysisSection =
  | 'overview'
  | 'charts'
  | 'statistics'
  | 'missing'
  | 'outliers'
  | 'correlation'
  | 'categorical'
  | 'quality'
  | 'business'
  | 'ai-summary'
  | 'export';

interface SidebarItem {
  key: AnalysisSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

interface AnalysisSidebarProps {
  activeSection: AnalysisSection;
  onChange: (section: AnalysisSection) => void;
  columns: AnalyticsColumn[];
  numericColumns: AnalyticsColumn[];
  categoricalColumns: AnalyticsColumn[];
  dateColumns: AnalyticsColumn[];
}

export function AnalysisSidebar({
  activeSection,
  onChange,
  columns,
  numericColumns,
  categoricalColumns,
  dateColumns,
}: AnalysisSidebarProps) {
  const items: SidebarItem[] = [
    { key: 'overview', label: 'Dataset Overview', icon: DatabaseIcon },
    { key: 'charts', label: 'Chart Analysis', icon: ChartIcon, badge: `${numericColumns.length + categoricalColumns.length}` },
    { key: 'statistics', label: 'Statistical Analysis', icon: HashIcon, badge: `${numericColumns.length}` },
    { key: 'missing', label: 'Missing Values', icon: AlertIcon },
    { key: 'outliers', label: 'Outlier Detection', icon: TrendingUpIcon },
    { key: 'correlation', label: 'Correlation', icon: LayersIcon, badge: numericColumns.length >= 2 ? undefined : 'N/A' },
    { key: 'categorical', label: 'Categorical Insights', icon: CheckCircleIcon, badge: `${categoricalColumns.length}` },
    { key: 'quality', label: 'Data Quality Score', icon: CheckCircleIcon },
    { key: 'business', label: 'Business Insights', icon: SparklesIcon },
    { key: 'ai-summary', label: 'AI Summary', icon: BrainIcon },
    { key: 'export', label: 'Export', icon: DownloadIcon },
  ];

  return (
    <aside className="w-64 shrink-0">
      <nav className="sticky top-2 flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#121214] p-3 max-h-[calc(100vh-100px)] overflow-y-auto">
        <div className="mb-2 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Analysis Dashboard
          </p>
        </div>
        {items.map((item) => {
          const selected = item.key === activeSection;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={clsx(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all',
                selected
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Column summary */}
        <div className="mt-4 border-t border-white/[0.06] px-3 pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            Column Summary
          </p>
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-medium text-slate-300">{columns.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Numeric</span>
              <span className="font-medium text-cyan-400">{numericColumns.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Categorical</span>
              <span className="font-medium text-amber-400">{categoricalColumns.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Date/Time</span>
              <span className="font-medium text-emerald-400">{dateColumns.length}</span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
