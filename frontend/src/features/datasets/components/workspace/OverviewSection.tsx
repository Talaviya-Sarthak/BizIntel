import { useMemo } from 'react';
import { ChartCard } from '../charts/ChartCard';
import { PieChart } from '../charts/PieChart';
import { CorrelationMatrix } from '../charts/CorrelationMatrix';
import { DatasetHealth } from './DatasetHealth';
import { DatasetKpiCards } from './DatasetKpiCards';
import {
  useCorrelation,
  useDatasetAnalyticsColumns,
  useDatasetOverview,
  useDatasetQuality,
} from '../../hooks/useDatasetAnalytics';
import { isNumericCategory } from '../../analytics/types';
import {
  AlertIcon,
  ColumnsIcon,
  HashIcon,
  LayersIcon,
  RowsIcon,
} from '../../../../components/ui/icons';

interface OverviewSectionProps {
  datasetId: string;
}

/** Compose the Overview tab: KPIs, health, composition and correlation. */
export function OverviewSection({ datasetId }: OverviewSectionProps) {
  const overviewQuery = useDatasetOverview(datasetId);
  const qualityQuery = useDatasetQuality(datasetId);
  const columnsQuery = useDatasetAnalyticsColumns(datasetId);

  const overview = overviewQuery.data;
  const quality = qualityQuery.data;
  const columns = columnsQuery.data?.columns ?? [];

  const numericColumns = useMemo(() => columns.filter((c) => isNumericCategory(c.category)), [columns]);
  const correlationQuery = useCorrelation(
    datasetId,
    numericColumns.length >= 2
      ? { columns: numericColumns.slice(0, 8).map((c) => c.name) }
      : undefined,
  );

  const composition = useMemo(
    () =>
      overview
        ? overview.byCategory.map((entry) => ({
            name: entry.category,
            value: entry.count,
          }))
        : [],
    [overview],
  );

  const loading = overviewQuery.isLoading || qualityQuery.isLoading;
  const error = overviewQuery.error?.message ?? qualityQuery.error?.message ?? null;

  return (
    <div className="flex flex-col gap-6">
      <DatasetKpiCards
        loading={loading}
        items={[
          { label: 'Rows', value: overview?.rowCount ?? '—', icon: RowsIcon },
          { label: 'Columns', value: overview?.columnCount ?? '—', icon: ColumnsIcon },
          { label: 'Numeric', value: overview?.numericColumns ?? '—', icon: HashIcon },
          { label: 'Categorical', value: overview?.categoricalColumns ?? '—', icon: LayersIcon },
          {
            label: 'Missing cells',
            value: overview ? `${overview.missingPercent.toFixed(1)}%` : '—',
            hint: overview ? `${overview.missingValues.toLocaleString()} cells` : undefined,
            icon: AlertIcon,
          },
          {
            label: 'Duplicate rows',
            value: overview ? `${overview.duplicatePercent.toFixed(1)}%` : '—',
            hint: overview ? `${overview.duplicateRows.toLocaleString()} rows` : undefined,
            icon: LayersIcon,
          },
        ]}
      />

      {error ? (
        <ChartCard
          title="Overview"
          error={error}
          onRetry={() => {
            overviewQuery.refetch();
            qualityQuery.refetch();
          }}
        />
      ) : null}

      {quality ? <DatasetHealth quality={quality} /> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Column composition"
          description="Columns by detected category"
          isLoading={loading}
          error={error}
          onRetry={() => overviewQuery.refetch()}
          isEmpty={composition.length === 0}
        >
          <PieChart data={composition} height={260} />
        </ChartCard>

        <ChartCard
          title="Numeric correlation"
          description="Pearson correlation between numeric columns"
          isLoading={columnsQuery.isLoading}
          error={columnsQuery.error ? columnsQuery.error.message : null}
          onRetry={() => columnsQuery.refetch()}
          isEmpty={!correlationQuery.data || correlationQuery.data.columns.length === 0}
          emptyTitle="Not enough numeric columns"
          emptyDescription="Add at least two numeric columns to see correlations."
        >
          {correlationQuery.data && correlationQuery.data.columns.length > 0 ? (
            <CorrelationMatrix
              columns={correlationQuery.data.columns}
              matrix={correlationQuery.data.matrix}
            />
          ) : null}
        </ChartCard>
      </div>
    </div>
  );
}
