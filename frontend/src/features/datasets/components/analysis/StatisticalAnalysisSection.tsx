import { useMemo } from 'react';
import type { FullColumnStatistics } from '../../analytics/types';
import { isNumericCategory } from '../../analytics/types';
import { formatNumber } from '../../../../utils/format';
import { HashIcon, TrendingUpIcon } from '../../../../components/ui/icons';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { SkeletonTable } from '../../../../components/ui/Skeleton';

interface StatisticalAnalysisSectionProps {
  datasetId: string;
  statistics?: FullColumnStatistics[];
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

export function StatisticalAnalysisSection({
  statistics,
  loading,
  error,
  onRetry,
}: StatisticalAnalysisSectionProps) {
  const numericStats = useMemo(
    () => statistics?.filter((s) => isNumericCategory(s.category)) ?? [],
    [statistics],
  );

  if (loading) return <SkeletonTable rows={6} cols={10} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <HashIcon className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">Statistical Analysis</h2>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          {numericStats.length} numeric columns
        </span>
      </div>

      {numericStats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500">
          No numeric columns found for statistical analysis.
        </div>
      ) : (
        <>
          {/* Metric Cards for each numeric column */}
          {numericStats.map((stat) => (
            <StatColumnCard key={stat.column} stat={stat} />
          ))}

          {/* Comparison Table */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Statistical Summary Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2.5 font-medium">Column</th>
                    <th className="px-3 py-2.5 font-medium text-right">Mean</th>
                    <th className="px-3 py-2.5 font-medium text-right">Median</th>
                    <th className="px-3 py-2.5 font-medium text-right">Std Dev</th>
                    <th className="px-3 py-2.5 font-medium text-right">Skewness</th>
                    <th className="px-3 py-2.5 font-medium text-right">Kurtosis</th>
                    <th className="px-3 py-2.5 font-medium text-right">IQR</th>
                  </tr>
                </thead>
                <tbody>
                  {numericStats.map((stat) => (
                    <tr
                      key={stat.column}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2.5 font-medium text-white">{stat.column}</td>
                      {stat.numeric && (
                        <>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.mean)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.median)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.stddev)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {stat.numeric.skewness.toFixed(3)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {stat.numeric.kurtosis.toFixed(3)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.iqr)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Percentile Table */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Percentile Distribution</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2.5 font-medium">Column</th>
                    <th className="px-3 py-2.5 font-medium text-right">P10</th>
                    <th className="px-3 py-2.5 font-medium text-right">P25</th>
                    <th className="px-3 py-2.5 font-medium text-right">P50</th>
                    <th className="px-3 py-2.5 font-medium text-right">P75</th>
                    <th className="px-3 py-2.5 font-medium text-right">P90</th>
                    <th className="px-3 py-2.5 font-medium text-right">P95</th>
                    <th className="px-3 py-2.5 font-medium text-right">P99</th>
                  </tr>
                </thead>
                <tbody>
                  {numericStats.map((stat) => (
                    <tr
                      key={stat.column}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2.5 font-medium text-white">{stat.column}</td>
                      {stat.numeric && (
                        <>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.p10)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.p25)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.p50)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.p75)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.p90)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.p95)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                            {formatNumber(stat.numeric.p99)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatColumnCard({ stat }: { stat: FullColumnStatistics }) {
  if (!stat.numeric) return null;
  const n = stat.numeric;

  const metrics = [
    { label: 'Mean', value: formatNumber(n.mean) },
    { label: 'Median', value: formatNumber(n.median) },
    { label: 'Mode', value: formatNumber(n.mode) },
    { label: 'Min', value: formatNumber(n.min) },
    { label: 'Max', value: formatNumber(n.max) },
    { label: 'Range', value: formatNumber(n.range) },
    { label: 'Std Dev', value: formatNumber(n.stddev) },
    { label: 'Variance', value: formatNumber(n.variance) },
    { label: 'Skewness', value: n.skewness.toFixed(3) },
    { label: 'Kurtosis', value: n.kurtosis.toFixed(3) },
    { label: 'IQR', value: formatNumber(n.iqr) },
    { label: 'Q1', value: formatNumber(n.q1) },
    { label: 'Q3', value: formatNumber(n.q3) },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
          <TrendingUpIcon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">{stat.column}</h3>
          <p className="text-xs text-slate-400">
            {stat.type} &middot; {stat.count.toLocaleString()} values &middot; {stat.nullPercent.toFixed(1)}% missing
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{m.label}</p>
            <p className="mt-1 font-mono text-sm font-bold text-white">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
