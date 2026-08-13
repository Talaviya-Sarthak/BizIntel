import { useMemo } from 'react';
import type { CorrelationResult } from '../../analytics/types';
import { LayersIcon } from '../../../../components/ui/icons';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { SkeletonChart } from '../../../../components/ui/Skeleton';

interface CorrelationSectionProps {
  datasetId: string;
  correlation?: CorrelationResult;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

export function CorrelationSection({
  correlation,
  loading,
  error,
  onRetry,
}: CorrelationSectionProps) {
  if (loading) return <SkeletonChart />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  const sortedPairs = useMemo(() => {
    if (!correlation) return [];
    return correlation.pairs
      .filter((p) => p.correlation !== null)
      .sort((a, b) => Math.abs(b.correlation!) - Math.abs(a.correlation!));
  }, [correlation]);

  const positivePairs = sortedPairs.filter((p) => p.correlation! > 0);
  const negativePairs = sortedPairs.filter((p) => p.correlation! < 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <LayersIcon className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">Correlation & Feature Insights</h2>
      </div>

      {!correlation || correlation.columns.length < 2 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500">
          Need at least 2 numeric columns for correlation analysis.
        </div>
      ) : (
        <>
          {/* Correlation Matrix */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Correlation Matrix</h3>
            <CorrelationHeatmap columns={correlation.columns} matrix={correlation.matrix} />
          </div>

          {/* Top Positive Relationships */}
          {positivePairs.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">Top Positive Relationships</h3>
              <div className="space-y-3">
                {positivePairs.slice(0, 5).map((pair) => (
                  <CorrelationPairCard key={`${pair.columnA}-${pair.columnB}`} pair={pair} />
                ))}
              </div>
            </div>
          )}

          {/* Top Negative Relationships */}
          {negativePairs.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">Top Negative Relationships</h3>
              <div className="space-y-3">
                {negativePairs.slice(0, 5).map((pair) => (
                  <CorrelationPairCard key={`${pair.columnA}-${pair.columnB}`} pair={pair} />
                ))}
              </div>
            </div>
          )}

          {/* All Pairs Table */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">All Correlation Pairs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2.5 font-medium">Column A</th>
                    <th className="px-3 py-2.5 font-medium">Column B</th>
                    <th className="px-3 py-2.5 font-medium text-right">Correlation</th>
                    <th className="px-3 py-2.5 font-medium">Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPairs.map((pair) => (
                    <tr
                      key={`${pair.columnA}-${pair.columnB}`}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2.5 font-medium text-white">{pair.columnA}</td>
                      <td className="px-3 py-2.5 font-medium text-white">{pair.columnB}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-300">
                        {pair.correlation!.toFixed(4)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${getStrengthColor(pair.correlation!)}`}>
                          {getStrengthLabel(pair.correlation!)}
                        </span>
                      </td>
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

function CorrelationHeatmap({ columns, matrix }: { columns: string[]; matrix: (number | null)[][] }) {
  const getColor = (value: number | null) => {
    if (value === null) return 'rgba(255,255,255,0.05)';
    const abs = Math.abs(value);
    if (value > 0) {
      if (abs > 0.7) return 'rgba(34,211,238,0.8)';
      if (abs > 0.4) return 'rgba(34,211,238,0.5)';
      if (abs > 0.2) return 'rgba(34,211,238,0.3)';
      return 'rgba(34,211,238,0.1)';
    } else {
      if (abs > 0.7) return 'rgba(251,113,133,0.8)';
      if (abs > 0.4) return 'rgba(251,113,133,0.5)';
      if (abs > 0.2) return 'rgba(251,113,133,0.3)';
      return 'rgba(251,113,133,0.1)';
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        <div className="flex items-end gap-1 pl-[120px]">
          {columns.map((col) => (
            <div
              key={col}
              className="flex h-20 w-14 items-end justify-center text-[10px] font-medium text-slate-400"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {col}
            </div>
          ))}
        </div>
        {matrix.map((row, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-[120px] truncate text-right text-[11px] font-medium text-slate-400">
              {columns[i]}
            </span>
            {row.map((val, j) => (
              <div
                key={j}
                className="flex h-14 w-14 items-center justify-center rounded text-[10px] font-bold text-white transition hover:scale-110"
                style={{ backgroundColor: getColor(val) }}
                title={`${columns[i]} x ${columns[j]}: ${val?.toFixed(3) ?? 'N/A'}`}
              >
                {val !== null ? val.toFixed(2) : '—'}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-cyan-400/80" /> Strong Positive
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-cyan-400/30" /> Weak Positive
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-400/30" /> Weak Negative
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-400/80" /> Strong Negative
        </div>
      </div>
    </div>
  );
}

function CorrelationPairCard({
  pair,
}: {
  pair: { columnA: string; columnB: string; correlation: number | null };
}) {
  if (pair.correlation === null) return null;
  const abs = Math.abs(pair.correlation);
  const barWidth = abs * 100;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{pair.columnA}</span>
          <span className="text-xs text-slate-500">{'<->'}</span>
          <span className="text-sm font-medium text-white">{pair.columnB}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${pair.correlation > 0 ? 'bg-cyan-400' : 'bg-red-400'}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
      <span className={`text-lg font-bold ${pair.correlation > 0 ? 'text-cyan-400' : 'text-red-400'}`}>
        {pair.correlation > 0 ? '+' : ''}{pair.correlation.toFixed(3)}
      </span>
    </div>
  );
}

function getStrengthColor(r: number): string {
  const abs = Math.abs(r);
  if (abs > 0.7) return r > 0 ? 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/30' : 'bg-red-400/10 text-red-300 ring-red-400/30';
  if (abs > 0.4) return r > 0 ? 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/20' : 'bg-red-400/10 text-red-300 ring-red-400/20';
  if (abs > 0.2) return 'bg-slate-400/10 text-slate-300 ring-slate-400/30';
  return 'bg-slate-400/10 text-slate-400 ring-slate-400/20';
}

function getStrengthLabel(r: number): string {
  const abs = Math.abs(r);
  if (abs > 0.7) return 'Strong';
  if (abs > 0.4) return 'Moderate';
  if (abs > 0.2) return 'Weak';
  return 'Very Weak';
}
