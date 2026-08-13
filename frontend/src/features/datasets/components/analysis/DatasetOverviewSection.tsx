import { useMemo, useState } from 'react';
import type { Dataset } from '../../types';
import type { DatasetOverview, DatasetQuality, AnalyticsColumn } from '../../analytics/types';
import { formatBytes, formatNumber } from '../../../../utils/format';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { SkeletonKpiCard } from '../../../../components/ui/Skeleton';
import {
  RowsIcon,
  ColumnsIcon,
  HashIcon,
  LayersIcon,
  AlertIcon,
  FileIcon,
} from '../../../../components/ui/icons';

interface DatasetOverviewSectionProps {
  datasetId: string;
  dataset: Dataset;
  overview?: DatasetOverview;
  quality?: DatasetQuality;
  columns: AnalyticsColumn[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function DatasetOverviewSection({
  dataset,
  overview,
  quality,
  columns,
  loading,
  error,
  onRetry,
}: DatasetOverviewSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const kpis = useMemo(() => {
    if (!overview || !quality) return [];
    return [
      { label: 'Rows', value: formatNumber(overview.rowCount), icon: RowsIcon, color: 'text-cyan-400 bg-cyan-400/10 ring-cyan-400/20' },
      { label: 'Columns', value: formatNumber(overview.columnCount), icon: ColumnsIcon, color: 'text-violet-400 bg-violet-400/10 ring-violet-400/20' },
      { label: 'Numeric', value: overview.numericColumns, icon: HashIcon, color: 'text-blue-400 bg-blue-400/10 ring-blue-400/20' },
      { label: 'Categorical', value: overview.categoricalColumns, icon: LayersIcon, color: 'text-amber-400 bg-amber-400/10 ring-amber-400/20' },
      { label: 'Date/Time', value: overview.dateColumns, icon: FileIcon, color: 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20' },
      { label: 'Duplicates', value: `${overview.duplicatePercent.toFixed(1)}%`, icon: AlertIcon, color: overview.duplicatePercent > 0 ? 'text-amber-400 bg-amber-400/10 ring-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20' },
      { label: 'Missing', value: `${overview.missingPercent.toFixed(1)}%`, icon: AlertIcon, color: overview.missingPercent > 0 ? 'text-amber-400 bg-amber-400/10 ring-amber-400/20' : 'text-emerald-400 bg-emerald-400/10 ring-emerald-400/20' },
      { label: 'File Size', value: formatBytes(dataset.fileSize), icon: FileIcon, color: 'text-slate-400 bg-slate-400/10 ring-slate-400/20' },
    ];
  }, [overview, quality, dataset]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonKpiCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Dataset Info Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{dataset.name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {dataset.originalFilename} &middot; {dataset.fileType.toUpperCase()} &middot; Uploaded{' '}
              {new Date(dataset.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-400/20">
            {dataset.status}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]"
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Data Quality Summary */}
      {quality && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Data Quality Summary</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <QualityTile
              label="Health Score"
              value={`${quality.healthScore}/100`}
              color={quality.healthScore >= 80 ? 'text-emerald-400' : quality.healthScore >= 60 ? 'text-amber-400' : 'text-red-400'}
            />
            <QualityTile
              label="Type Consistency"
              value={`${quality.typeConsistency.toFixed(0)}%`}
              color={quality.typeConsistency >= 90 ? 'text-emerald-400' : 'text-amber-400'}
            />
            <QualityTile
              label="Missing Cells"
              value={formatNumber(quality.missingValues)}
              color={quality.missingPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}
            />
            <QualityTile
              label="Invalid Values"
              value={formatNumber(quality.invalidValues)}
              color={quality.invalidPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}
            />
          </div>
          {quality.reasons.length > 0 && (
            <div className="mt-4 space-y-2">
              {quality.reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
                    reason.level === 'good'
                      ? 'bg-emerald-400/5 text-emerald-300'
                      : 'bg-amber-400/5 text-amber-300'
                  }`}
                >
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                  <div>
                    <span className="font-medium">{reason.title}</span>
                    <span className="ml-1.5 text-slate-400">{reason.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Column Types Breakdown */}
      {overview && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Column Type Distribution</h3>
          <div className="space-y-3">
            {overview.byCategory.map((cat) => {
              const total = overview.columnCount;
              const pct = total > 0 ? (cat.count / total) * 100 : 0;
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium text-slate-300 capitalize">{cat.category}</span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs text-slate-400">{cat.count}</span>
                  <span className="w-12 text-right text-xs text-slate-500">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Preview Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Data Preview</h3>
          <input
            type="text"
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="input-field w-64 text-xs"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5 font-medium">#</th>
                <th className="px-3 py-2.5 font-medium">Column Name</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Nullable</th>
              </tr>
            </thead>
            <tbody>
              {columns
                .filter((col) =>
                  col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  col.type.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .slice(page * pageSize, (page + 1) * pageSize)
                .map((col, idx) => (
                  <tr
                    key={col.name}
                    className="border-b border-white/5 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2.5 text-xs text-slate-500">{page * pageSize + idx + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-white">{col.name}</td>
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{col.type}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${getCategoryColor(col.category)}`}>
                        {col.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{col.nullable ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, columns.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length)} of{' '}
            {columns.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= columns.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())).length}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QualityTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'integer':
    case 'float':
    case 'decimal':
      return 'bg-blue-400/10 text-blue-300 ring-blue-400/30';
    case 'string':
    case 'uuid':
      return 'bg-amber-400/10 text-amber-300 ring-amber-400/30';
    case 'date':
    case 'time':
    case 'datetime':
      return 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30';
    case 'boolean':
      return 'bg-violet-400/10 text-violet-300 ring-violet-400/30';
    default:
      return 'bg-slate-400/10 text-slate-300 ring-slate-400/30';
  }
}
