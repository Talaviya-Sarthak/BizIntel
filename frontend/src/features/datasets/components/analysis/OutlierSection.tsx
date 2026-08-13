import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';
import type { OutlierAnalysis } from '../../analytics/types';
import { TrendingUpIcon } from '../../../../components/ui/icons';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { SkeletonTable } from '../../../../components/ui/Skeleton';
import { ChartTooltip, CHART_COLORS, CHART_AXIS, CHART_GRID } from '../charts/chartShared';
import { formatNumber } from '../../../../utils/format';

interface OutlierSectionProps {
  datasetId: string;
  data?: OutlierAnalysis;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

export function OutlierSection({
  data,
  loading,
  error,
  onRetry,
}: OutlierSectionProps) {
  if (loading) return <SkeletonTable rows={6} cols={8} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!data) return null;

  const chartData = data.columns
    .filter((c) => c.outlierCount > 0)
    .sort((a, b) => b.outlierPercent - a.outlierPercent)
    .map((c) => ({
      name: c.column,
      outliers: c.outlierCount,
      pct: c.outlierPercent,
      normal: c.totalRows - c.outlierCount,
    }));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <TrendingUpIcon className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">Outlier Detection</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Total Outliers"
          value={formatNumber(data.summary.totalOutliers)}
          color={data.summary.totalOutliers > 0 ? 'text-amber-400' : 'text-emerald-400'}
        />
        <SummaryCard
          label="Columns with Outliers"
          value={`${data.summary.columnsWithOutliers} / ${data.columns.length}`}
          color="text-cyan-400"
        />
        <SummaryCard
          label="Worst Column"
          value={data.summary.worstColumn ?? 'None'}
          color="text-white"
        />
        <SummaryCard
          label="Method"
          value="IQR + Z-Score"
          color="text-slate-300"
        />
      </div>

      {/* Outlier Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Outlier Count by Column</h3>
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
            <BarChart data={chartData}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="name" {...CHART_AXIS} />
              <YAxis {...CHART_AXIS} />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              <Bar dataKey="normal" stackId="a" fill={CHART_COLORS[0]} name="Normal" radius={[0, 0, 0, 0]} />
              <Bar dataKey="outliers" stackId="a" fill={CHART_COLORS[9]} name="Outliers" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Outlier Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Detailed Outlier Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5 font-medium">Column</th>
                <th className="px-3 py-2.5 font-medium text-right">Q1</th>
                <th className="px-3 py-2.5 font-medium text-right">Q3</th>
                <th className="px-3 py-2.5 font-medium text-right">IQR</th>
                <th className="px-3 py-2.5 font-medium text-right">Lower Bound</th>
                <th className="px-3 py-2.5 font-medium text-right">Upper Bound</th>
                <th className="px-3 py-2.5 font-medium text-right">IQR Outliers</th>
                <th className="px-3 py-2.5 font-medium text-right">Z-Score Outliers</th>
                <th className="px-3 py-2.5 font-medium text-right">Outlier %</th>
              </tr>
            </thead>
            <tbody>
              {data.columns.map((col) => (
                <tr
                  key={col.column}
                  className="border-b border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-3 py-2.5 font-medium text-white">{col.column}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                    {formatNumber(col.q1)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                    {formatNumber(col.q3)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                    {formatNumber(col.iqr)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                    {formatNumber(col.lowerBound)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                    {formatNumber(col.upperBound)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                    {formatNumber(col.outlierCount)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                    {col.zScoreOutliers !== undefined ? formatNumber(col.zScoreOutliers) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
                        col.outlierPercent > 5
                          ? 'bg-red-400/10 text-red-300 ring-red-400/30'
                          : col.outlierPercent > 1
                          ? 'bg-amber-400/10 text-amber-300 ring-amber-400/30'
                          : 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30'
                      }`}
                    >
                      {col.outlierPercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IQR Visualization */}
      {data.columns.filter((c) => c.outlierCount > 0).length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">IQR Distribution Visualization</h3>
          <div className="space-y-4">
            {data.columns
              .filter((c) => c.outlierCount > 0)
              .map((col) => {
                const range = col.upperBound - col.lowerBound;
                const q1Pos = range > 0 ? ((col.q1 - col.lowerBound) / range) * 100 : 0;
                const q3Pos = range > 0 ? ((col.q3 - col.lowerBound) / range) * 100 : 0;
                return (
                  <div key={col.column}>
                    <p className="mb-1 text-xs font-medium text-slate-300">{col.column}</p>
                    <div className="relative h-8 rounded-full bg-white/5">
                      {/* IQR Box */}
                      <div
                        className="absolute top-0 h-full bg-cyan-400/20 border-x border-cyan-400/40"
                        style={{
                          left: `${q1Pos}%`,
                          width: `${q3Pos - q1Pos}%`,
                        }}
                      />
                      {/* Median line */}
                      <div
                        className="absolute top-0 h-full w-0.5 bg-cyan-400"
                        style={{ left: `${(q1Pos + q3Pos) / 2}%` }}
                      />
                      {/* Outlier markers */}
                      <div className="absolute -top-1 -bottom-1 left-0 w-0.5 bg-amber-400/50" />
                      <div className="absolute -top-1 -bottom-1 right-0 w-0.5 bg-amber-400/50" />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                      <span>{formatNumber(col.lowerBound)}</span>
                      <span>{formatNumber(col.upperBound)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
