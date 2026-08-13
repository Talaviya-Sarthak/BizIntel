import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { MissingValueAnalysis } from '../../analytics/types';
import { AlertIcon } from '../../../../components/ui/icons';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { SkeletonTable } from '../../../../components/ui/Skeleton';
import { ChartTooltip, CHART_COLORS, CHART_AXIS, CHART_GRID } from '../charts/chartShared';
import { formatNumber } from '../../../../utils/format';

interface MissingValuesSectionProps {
  datasetId: string;
  data?: MissingValueAnalysis;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

export function MissingValuesSection({
  data,
  loading,
  error,
  onRetry,
}: MissingValuesSectionProps) {
  const [fillMethod, setFillMethod] = useState<string>('mean');

  if (loading) return <SkeletonTable rows={6} cols={5} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return null;

  const chartData = data.columns
    .filter((c) => c.missing > 0)
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 20)
    .map((c) => ({ name: c.column, missing: c.missing, pct: c.missingPercent }));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <AlertIcon className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Missing Value Analysis</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Total Cells"
          value={formatNumber(data.totalCells)}
          color="text-slate-300"
        />
        <SummaryCard
          label="Missing Cells"
          value={formatNumber(data.totalMissing)}
          color={data.totalMissing > 0 ? 'text-amber-400' : 'text-emerald-400'}
        />
        <SummaryCard
          label="Missing %"
          value={`${data.totalMissingPercent.toFixed(1)}%`}
          color={data.totalMissingPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}
        />
        <SummaryCard
          label="Columns with Missing"
          value={`${data.columns.filter((c) => c.missing > 0).length} / ${data.columns.length}`}
          color="text-cyan-400"
        />
      </div>

      {/* Missing Values Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Missing Values by Column</h3>
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 32)}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid {...CHART_GRID} />
              <XAxis type="number" {...CHART_AXIS} />
              <YAxis type="category" dataKey="name" {...CHART_AXIS} width={150} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="missing" fill={CHART_COLORS[9]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Column Ranking Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Column Ranking</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5 font-medium">Rank</th>
                <th className="px-3 py-2.5 font-medium">Column</th>
                <th className="px-3 py-2.5 font-medium text-right">Missing</th>
                <th className="px-3 py-2.5 font-medium text-right">Missing %</th>
                <th className="px-3 py-2.5 font-medium">Completeness</th>
              </tr>
            </thead>
            <tbody>
              {data.columns.map((col) => (
                <tr
                  key={col.column}
                  className="border-b border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2.5 text-slate-400">#{col.rank}</td>
                  <td className="px-3 py-2.5 font-medium text-white">{col.column}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{formatNumber(col.missing)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{col.missingPercent.toFixed(1)}%</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full ${
                            col.missingPercent === 0
                              ? 'bg-emerald-400'
                              : col.missingPercent < 5
                              ? 'bg-cyan-400'
                              : col.missingPercent < 20
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(100, 100 - col.missingPercent)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{(100 - col.missingPercent).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Treatment */}
      {data.recommendations.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Recommended Treatment</h3>
          <div className="space-y-3">
            {data.recommendations.map((rec) => (
              <div
                key={rec.column}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{rec.column}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{rec.reason}</p>
                </div>
                <span className="shrink-0 rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-medium text-cyan-400 ring-1 ring-cyan-400/20">
                  {rec.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Treatment Options */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Imputation Methods</h3>
        <p className="mb-4 text-xs text-slate-400">
          Select a method to fill missing values. This is a preview - actual changes require confirmation.
        </p>
        <div className="flex flex-wrap gap-2">
          {['mean', 'median', 'mode', 'forward_fill', 'backward_fill', 'remove_rows', 'remove_columns'].map(
            (method) => (
              <button
                key={method}
                onClick={() => setFillMethod(method)}
                className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
                  fillMethod === method
                    ? 'bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20'
                    : 'border border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                {method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ),
          )}
        </div>
        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-slate-400">
            {fillMethod === 'mean' && 'Replace missing values with the column mean. Best for normally distributed data without outliers.'}
            {fillMethod === 'median' && 'Replace missing values with the column median. Robust to outliers.'}
            {fillMethod === 'mode' && 'Replace missing values with the most frequent value. Best for categorical data.'}
            {fillMethod === 'forward_fill' && 'Propagate the last valid observation forward. Good for time-series data.'}
            {fillMethod === 'backward_fill' && 'Use the next valid observation to fill gaps. Good for time-series data.'}
            {fillMethod === 'remove_rows' && 'Remove all rows with any missing values. May significantly reduce dataset size.'}
            {fillMethod === 'remove_columns' && 'Remove columns with missing values. Use when a column has excessive missing data.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
