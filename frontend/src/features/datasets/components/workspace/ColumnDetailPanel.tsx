import { Button } from '../../../../components/ui/Button';
import { ChartCard } from '../charts/ChartCard';
import { HistogramChart } from '../charts/HistogramChart';
import { BarChart } from '../charts/BarChart';
import {
  useColumnDistribution,
  useColumnOutliers,
  useColumnStatistics,
  useColumnTopValues,
} from '../../hooks/useDatasetAnalytics';
import type { AnalyticsColumn } from '../../analytics/types';
import { isNumericCategory, isDateCategory } from '../../analytics/types';
import { formatNumber } from '../../../../utils/format';
import { CloseIcon } from '../../../../components/ui/icons';

interface ColumnDetailPanelProps {
  datasetId: string;
  column: AnalyticsColumn;
  onClose?: () => void;
}

/** Full analytical profile for a single column: stats, distribution, outliers. */
export function ColumnDetailPanel({ datasetId, column, onClose }: ColumnDetailPanelProps) {
  const statsQuery = useColumnStatistics(datasetId, column.name);
  const distributionQuery = useColumnDistribution(datasetId, column.name, 30);
  const topValuesQuery = useColumnTopValues(datasetId, column.name, 10);
  const outliersQuery = useColumnOutliers(datasetId, column.name);

  const numeric = isNumericCategory(column.category);
  const date = isDateCategory(column.category);
  const stats = statsQuery.data;
  const distribution = distributionQuery.data;
  const topValues = topValuesQuery.data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            {column.name}
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300 ring-1 ring-white/10">
              {column.type}
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {column.category} column · {column.nullable ? 'nullable' : 'not nullable'}
          </p>
        </div>
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close column detail">
            <CloseIcon className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <ChartCard
        title="Summary statistics"
        isLoading={statsQuery.isLoading}
        error={statsQuery.error ? statsQuery.error.message : null}
        onRetry={() => statsQuery.refetch()}
        isEmpty={!stats}
      >
        {stats ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Non-null count" value={formatNumber(stats.count)} />
            <Stat label="Null count" value={formatNumber(stats.nullCount)} />
            <Stat label="Null %" value={`${stats.nullPercent.toFixed(1)}%`} />
            <Stat label="Unique" value={formatNumber(stats.uniqueCount)} />
            {numeric && stats.numeric ? (
              <>
                <Stat label="Min" value={formatNumber(stats.numeric.min)} />
                <Stat label="Max" value={formatNumber(stats.numeric.max)} />
                <Stat label="Mean" value={formatNumber(stats.numeric.mean)} />
                <Stat label="Median" value={formatNumber(stats.numeric.median)} />
                <Stat label="Std dev" value={formatNumber(stats.numeric.stddev)} />
                <Stat label="P25" value={formatNumber(stats.numeric.p25)} />
                <Stat label="P75" value={formatNumber(stats.numeric.p75)} />
                <Stat label="P95" value={formatNumber(stats.numeric.p95)} />
              </>
            ) : null}
            {stats.boolean ? (
              <>
                <Stat label="True" value={formatNumber(stats.boolean.trueCount)} />
                <Stat label="False" value={formatNumber(stats.boolean.falseCount)} />
              </>
            ) : null}
            {date && stats.date ? (
              <>
                <Stat label="Min date" value={stats.date.min ?? '—'} />
                <Stat label="Max date" value={stats.date.max ?? '—'} />
                <Stat
                  label="Range (days)"
                  value={stats.date.rangeDays === null ? '—' : formatNumber(stats.date.rangeDays)}
                />
              </>
            ) : null}
            {stats.categorical ? (
              <Stat label="Distinct" value={formatNumber(stats.categorical.distinctCount)} />
            ) : null}
          </div>
        ) : null}
      </ChartCard>

      {distribution?.kind === 'histogram' ? (
        <ChartCard
          title="Distribution"
          description={`${distribution.buckets.length} buckets across the numeric range`}
          isLoading={distributionQuery.isLoading}
          error={distributionQuery.error ? distributionQuery.error.message : null}
          onRetry={() => distributionQuery.refetch()}
          isEmpty={distribution.buckets.length === 0}
        >
          <HistogramChart buckets={distribution.buckets} />
        </ChartCard>
      ) : null}

      {distribution?.kind === 'categorical' && distribution.topValues.length > 0 ? (
        <ChartCard
          title="Top values"
          description={`Most frequent values across ${formatNumber(topValues?.total ?? 0)} rows`}
          isLoading={distributionQuery.isLoading}
          error={distributionQuery.error ? distributionQuery.error.message : null}
          onRetry={() => distributionQuery.refetch()}
        >
          <BarChart
            data={distribution.topValues.map((v) => ({
              name: String(v.value),
              count: v.count,
            }))}
            xKey="name"
            yKey="count"
            name="Count"
            horizontal
            height={Math.max(220, distribution.topValues.length * 36)}
          />
        </ChartCard>
      ) : null}

      {numeric ? (
        <ChartCard
          title="Outliers"
          description="Detected via the interquartile range (IQR) method"
          isLoading={outliersQuery.isLoading}
          error={outliersQuery.error ? outliersQuery.error.message : null}
          onRetry={() => outliersQuery.refetch()}
          isEmpty={!outliersQuery.data}
        >
          {outliersQuery.data ? (
            <OutlierSummary result={outliersQuery.data} />
          ) : null}
        </ChartCard>
      ) : null}

      {!numeric && !date && topValues && topValues.topValues.length === 0 ? (
        <ChartCard
          title="Top values"
          isLoading={topValuesQuery.isLoading}
          error={topValuesQuery.error ? topValuesQuery.error.message : null}
          onRetry={() => topValuesQuery.refetch()}
          isEmpty
          emptyTitle="No distinct values"
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
      <dt className="text-[11px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-lg font-semibold text-white" title={value}>
        {value}
      </dd>
    </div>
  );
}

function OutlierSummary({ result }: { result: { outlierCount: number; outlierPercent: number; q1: number; q3: number; lowerBound: number; upperBound: number } }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat label="Outliers" value={formatNumber(result.outlierCount)} />
      <Stat label="Share of rows" value={`${result.outlierPercent.toFixed(1)}%`} />
      <Stat label="Q1" value={formatNumber(result.q1)} />
      <Stat label="Q3" value={formatNumber(result.q3)} />
      <div className="col-span-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-3.5 py-3 lg:col-span-1">
        <dt className="text-[11px] uppercase tracking-wider text-amber-300/70">Bounds</dt>
        <dd className="mt-1 text-sm font-medium text-white">
          <span className="text-slate-400">[</span>
          {formatNumber(result.lowerBound)}
          <span className="text-slate-400">, </span>
          {formatNumber(result.upperBound)}
          <span className="text-slate-400">]</span>
        </dd>
      </div>
    </div>
  );
}
