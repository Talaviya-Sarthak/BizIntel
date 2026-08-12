import { useMemo } from 'react';
import { ChartCard } from '../charts/ChartCard';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { CorrelationMatrix } from '../charts/CorrelationMatrix';
import { SparklesIcon } from '../../../../components/ui/icons';
import { useCorrelation, useGroupBy, useTimeSeries } from '../../hooks/useDatasetAnalytics';
import type { AnalyticsColumn } from '../../analytics/types';
import { isCategoricalCategory, isDateCategory, isNumericCategory } from '../../analytics/types';

interface SuggestedChartsProps {
  datasetId: string;
  columns: AnalyticsColumn[];
}

/** Auto-generated starter charts for the Charts tab: no configuration required. */
export function SuggestedCharts({ datasetId, columns }: SuggestedChartsProps) {
  const dateColumn = useMemo(() => columns.find((c) => isDateCategory(c.category)), [columns]);
  const categoricalColumn = useMemo(
    () => columns.find((c) => isCategoricalCategory(c.category)),
    [columns],
  );
  const numericColumns = useMemo(() => columns.filter((c) => isNumericCategory(c.category)), [columns]);
  const hasCorrelation = numericColumns.length >= 2;

  const trendBody = dateColumn ? { dateColumn: dateColumn.name, granularity: 'month' as const, aggregation: 'count' as const } : null;
  const trendQuery = useTimeSeries(datasetId, trendBody);

  const topBody = categoricalColumn
    ? { groupBy: categoricalColumn.name, aggregation: 'count' as const, topN: 10 }
    : null;
  const topQuery = useGroupBy(datasetId, topBody);

  const correlationQuery = useCorrelation(datasetId, { columns: numericColumns.slice(0, 8).map((c) => c.name) });

  if (!dateColumn && !categoricalColumn && !hasCorrelation) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 bg-black">
      <div className="flex items-center gap-2 border-b-2 border-white pb-3">
        <SparklesIcon className="h-5 w-5 text-lime" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">Suggested charts</h2>
      </div>

      {dateColumn ? (
        <ChartCard
          title="Trend over time"
          description={`Row counts per month (${dateColumn.name})`}
          isLoading={trendQuery.isLoading}
          error={trendQuery.error ? trendQuery.error.message : null}
          onRetry={() => trendQuery.refetch()}
          isEmpty={trendQuery.data?.points.length === 0}
        >
          {trendQuery.data && trendQuery.data.points.length > 0 ? (
            <LineChart
              data={trendQuery.data.points.map((p) => ({ label: p.label, value: p.value }))}
              xKey="label"
              yKey="value"
              name="Rows"
              height={320}
            />
          ) : null}
        </ChartCard>
      ) : null}

      {categoricalColumn ? (
        <ChartCard
          title="Top categories"
          description={`Most frequent values in ${categoricalColumn.name}`}
          isLoading={topQuery.isLoading}
          error={topQuery.error ? topQuery.error.message : null}
          onRetry={() => topQuery.refetch()}
          isEmpty={topQuery.data?.rows.length === 0}
        >
          {topQuery.data && topQuery.data.rows.length > 0 ? (
            <BarChart
              data={topQuery.data.rows.map((row) => ({ name: String(row.key), value: row.value }))}
              xKey="name"
              yKey="value"
              name="Count"
              horizontal
              height={Math.max(260, topQuery.data.rows.length * 32)}
            />
          ) : null}
        </ChartCard>
      ) : null}

      {hasCorrelation ? (
        <ChartCard
          title="Correlation"
          description="Pearson correlation between numeric columns"
          isLoading={correlationQuery.isLoading}
          error={correlationQuery.error ? correlationQuery.error.message : null}
          onRetry={() => correlationQuery.refetch()}
          isEmpty={correlationQuery.data?.columns.length === 0}
        >
          {correlationQuery.data && correlationQuery.data.columns.length > 0 ? (
            <CorrelationMatrix
              columns={correlationQuery.data.columns}
              matrix={correlationQuery.data.matrix}
            />
          ) : null}
        </ChartCard>
      ) : null}
    </div>
  );
}
