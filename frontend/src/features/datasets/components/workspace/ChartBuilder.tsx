import { useState } from 'react';
import { clsx } from 'clsx';
import { ChartCard } from '../charts/ChartCard';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { ScatterChart } from '../charts/ScatterChart';
import { ChartIcon, PlayIcon } from '../../../../components/ui/icons';
import { useGroupBy, useScatter, useTimeSeries } from '../../hooks/useDatasetAnalytics';
import type {
  AggregationFunction,
  AnalyticsColumn,
  TimeGranularity,
} from '../../analytics/types';
import { isCategoricalCategory, isDateCategory, isNumericCategory } from '../../analytics/types';

type ChartKind = 'bar' | 'line' | 'scatter';

const AGGREGATIONS: AggregationFunction[] = ['count', 'sum', 'avg', 'min', 'max'];
const GRANULARITIES: TimeGranularity[] = ['day', 'week', 'month', 'quarter', 'year'];

interface ChartBuilderProps {
  datasetId: string;
  columns: AnalyticsColumn[];
}

/** Interactive chart builder backed by server-side aggregations. */
export function ChartBuilder({ datasetId, columns }: ChartBuilderProps) {
  const [kind, setKind] = useState<ChartKind>('bar');
  const [groupByCol, setGroupByCol] = useState('');
  const [metricCol, setMetricCol] = useState('');
  const [aggregation, setAggregation] = useState<AggregationFunction>('count');
  const [topN, setTopN] = useState(10);
  const [dateCol, setDateCol] = useState('');
  const [granularity, setGranularity] = useState<TimeGranularity>('month');
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');

  const categorical = columns.filter((c) => isCategoricalCategory(c.category));
  const numeric = columns.filter((c) => isNumericCategory(c.category));
  const dates = columns.filter((c) => isDateCategory(c.category));

  const groupByBody =
    kind === 'bar' && groupByCol ? { groupBy: groupByCol, aggregation, metric: aggregation === 'count' ? undefined : metricCol || undefined, topN } : null;
  const groupByQuery = useGroupBy(datasetId, groupByBody);

  const timeSeriesBody =
    kind === 'line' && dateCol
      ? { dateColumn: dateCol, granularity, aggregation, metric: aggregation === 'count' ? undefined : metricCol || undefined }
      : null;
  const timeSeriesQuery = useTimeSeries(datasetId, timeSeriesBody);

  const scatterBody = kind === 'scatter' && xCol && yCol ? { x: xCol, y: yCol } : null;
  const scatterQuery = useScatter(datasetId, scatterBody);

  const needsRun =
    (kind === 'bar' && !groupByCol) ||
    (kind === 'line' && !dateCol) ||
    (kind === 'scatter' && (!xCol || !yCol));

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ChartIcon className="h-4 w-4 text-cyan-400" />
            Build a chart
          </h3>
          <div className="inline-flex overflow-hidden rounded-lg border border-white/10">
            {(['bar', 'line', 'scatter'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setKind(option)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium capitalize transition',
                  kind === option ? 'bg-cyan-400/15 text-cyan-300' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          {kind === 'bar' ? (
            <>
              <Field label="Group by" hint="Categorical column">
                <select value={groupByCol} onChange={(e) => setGroupByCol(e.target.value)}>
                  <option value="">Select…</option>
                  {categorical.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Aggregation">
                <select value={aggregation} onChange={(e) => setAggregation(e.target.value as AggregationFunction)}>
                  {AGGREGATIONS.map((agg) => (
                    <option key={agg} value={agg}>{agg}</option>
                  ))}
                </select>
              </Field>
              {aggregation !== 'count' ? (
                <Field label="Metric column">
                  <select value={metricCol} onChange={(e) => setMetricCol(e.target.value)}>
                    <option value="">Select…</option>
                    {numeric.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <Field label={`Show top ${topN}`}>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={1}
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="w-36 accent-cyan-400"
                />
              </Field>
            </>
          ) : null}

          {kind === 'line' ? (
            <>
              <Field label="Date column">
                <select value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
                  <option value="">Select…</option>
                  {dates.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Granularity">
                <select value={granularity} onChange={(e) => setGranularity(e.target.value as TimeGranularity)}>
                  {GRANULARITIES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
              <Field label="Aggregation">
                <select value={aggregation} onChange={(e) => setAggregation(e.target.value as AggregationFunction)}>
                  {AGGREGATIONS.map((agg) => (
                    <option key={agg} value={agg}>{agg}</option>
                  ))}
                </select>
              </Field>
              {aggregation !== 'count' ? (
                <Field label="Metric column">
                  <select value={metricCol} onChange={(e) => setMetricCol(e.target.value)}>
                    <option value="">Select…</option>
                    {numeric.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </>
          ) : null}

          {kind === 'scatter' ? (
            <>
              <Field label="X column">
                <select value={xCol} onChange={(e) => setXCol(e.target.value)}>
                  <option value="">Select…</option>
                  {numeric.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Y column">
                <select value={yCol} onChange={(e) => setYCol(e.target.value)}>
                  <option value="">Select…</option>
                  {numeric.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}

          {needsRun ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <PlayIcon className="h-3.5 w-3.5" />
              Complete the fields above to render.
            </p>
          ) : null}
        </div>
      </div>

      {kind === 'bar' ? (
        <ChartCard
          title={`${groupByCol || 'Column'} by ${aggregation}`}
          description={
            aggregation === 'count' ? 'Row count per group' : `${aggregation} of ${metricCol || 'selected metric'}`
          }
          isLoading={groupByQuery.isLoading}
          error={groupByQuery.error ? groupByQuery.error.message : null}
          onRetry={() => groupByQuery.refetch()}
          isEmpty={groupByQuery.data?.rows.length === 0}
        >
          {groupByQuery.data && groupByQuery.data.rows.length > 0 ? (
            <BarChart
              data={groupByQuery.data.rows.map((row) => ({ name: String(row.key), value: row.value }))}
              xKey="name"
              yKey="value"
              name={aggregation}
              height={Math.max(300, Math.min(groupByQuery.data.rows.length * 32, 520))}
            />
          ) : null}
        </ChartCard>
      ) : null}

      {kind === 'line' ? (
        <ChartCard
          title={`${dateCol || 'Date'} over time`}
          description={`${aggregation} aggregated per ${granularity}`}
          isLoading={timeSeriesQuery.isLoading}
          error={timeSeriesQuery.error ? timeSeriesQuery.error.message : null}
          onRetry={() => timeSeriesQuery.refetch()}
          isEmpty={timeSeriesQuery.data?.points.length === 0}
        >
          {timeSeriesQuery.data && timeSeriesQuery.data.points.length > 0 ? (
            <LineChart
              data={timeSeriesQuery.data.points.map((p) => ({ label: p.label, value: p.value }))}
              xKey="label"
              yKey="value"
              name={aggregation}
              height={340}
            />
          ) : null}
        </ChartCard>
      ) : null}

      {kind === 'scatter' ? (
        <ChartCard
          title={`${xCol || 'X'} vs ${yCol || 'Y'}`}
          description={
            scatterQuery.data
              ? `Scatter of ${scatterQuery.data.total.toLocaleString()} rows${scatterQuery.data.sampled < scatterQuery.data.total ? ` (sampled ${scatterQuery.data.sampled})` : ''}`
              : 'Numeric correlation view'
          }
          isLoading={scatterQuery.isLoading}
          error={scatterQuery.error ? scatterQuery.error.message : null}
          onRetry={() => scatterQuery.refetch()}
          isEmpty={scatterQuery.data?.points.length === 0}
        >
          {scatterQuery.data && scatterQuery.data.points.length > 0 ? (
            <ScatterChart
              data={scatterQuery.data.points}
              xName={xCol}
              yName={yCol}
              height={360}
            />
          ) : null}
        </ChartCard>
      ) : null}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1.5 text-xs text-slate-500">
      <span>
        {label}
        {hint ? <span className="ml-1 text-slate-600">({hint})</span> : null}
      </span>
      <div className="[&_select]:h-9 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/10 [&_select]:bg-slate-900 [&_select]:px-2.5 [&_select]:text-sm [&_select]:text-slate-200 [&_select]:focus:border-cyan-400/50 [&_select]:focus:outline-none">
        {children}
      </div>
    </label>
  );
}
