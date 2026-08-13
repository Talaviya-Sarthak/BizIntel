import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';
import type { AnalyticsColumn } from '../../analytics/types';
import { useGroupBy } from '../../hooks/useDatasetAnalytics';
import { ChartTooltip, CHART_COLORS } from '../charts/chartShared';
import { LayersIcon } from '../../../../components/ui/icons';

interface CategoricalInsightsSectionProps {
  datasetId: string;
  columns: AnalyticsColumn[];
}

export function CategoricalInsightsSection({
  datasetId,
  columns,
}: CategoricalInsightsSectionProps) {
  if (columns.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <LayersIcon className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Categorical Insights</h2>
        </div>
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-500">
          No categorical columns found in this dataset.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <LayersIcon className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Categorical Insights</h2>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          {columns.length} columns
        </span>
      </div>

      {columns.map((col) => (
        <CategoricalColumnInsight
          key={col.name}
          datasetId={datasetId}
          column={col}
        />
      ))}
    </div>
  );
}

function CategoricalColumnInsight({
  datasetId,
  column,
}: {
  datasetId: string;
  column: AnalyticsColumn;
}) {
  const topQuery = useGroupBy(datasetId, {
    groupBy: column.name,
    aggregation: 'count',
    topN: 20,
  });

  const data = useMemo(() => {
    if (!topQuery.data?.rows) return [];
    return topQuery.data.rows.map((r) => ({
      name: String(r.key),
      value: r.value,
    }));
  }, [topQuery.data]);

  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const uniqueCount = data.length;
  const rareThreshold = total * 0.01;
  const rareCategories = data.filter((d) => d.value <= rareThreshold);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{column.name}</h3>
          <p className="text-xs text-slate-400">{column.type} &middot; {uniqueCount} distinct values</p>
        </div>
        <div className="flex gap-4 text-xs text-slate-500">
          <span>Total: <span className="font-medium text-slate-300">{total.toLocaleString()}</span></span>
          <span>Rare (&lt;1%): <span className="font-medium text-amber-400">{rareCategories.length}</span></span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Frequency Table */}
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Frequency Table</h4>
          <div className="space-y-2">
            {data.slice(0, 10).map((d, idx) => {
              const pct = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="w-6 text-right text-[10px] text-slate-500">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-medium text-white">{d.name}</span>
                      <span className="ml-2 text-[10px] text-slate-400">{d.value.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-[10px] text-slate-400">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie Chart */}
        {data.length <= 10 && (
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Distribution</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.slice(0, 8).map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Cardinality Info */}
      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Cardinality</span>
          <span className={`font-medium ${uniqueCount > 100 ? 'text-red-400' : uniqueCount > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {uniqueCount} {uniqueCount > 100 ? '(High)' : uniqueCount > 20 ? '(Medium)' : '(Low)'}
          </span>
        </div>
        {rareCategories.length > 0 && (
          <p className="mt-2 text-[11px] text-slate-500">
            {rareCategories.length} categories have less than 1% of total values and may be considered rare.
          </p>
        )}
      </div>
    </div>
  );
}
