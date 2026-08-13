import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import { toApiError } from '../../../lib/api';
import { BarChart } from '../../datasets/components/charts/BarChart';
import { LineChart } from '../../datasets/components/charts/LineChart';
import { PieChart } from '../../datasets/components/charts/PieChart';
import { ScatterChart } from '../../datasets/components/charts/ScatterChart';
import { datamartApi } from '../services/datamartApi';
import { describeDataMartError } from '../utils/datamartErrors';
import { ResultTable } from './ResultTable';
import { formatMetricValue } from '../utils/formatting';
import { recommendChart } from '../utils/chartRecommendations';
import type { DataMartDashboardWidget, DataMartQueryResult, MetricFormat } from '../types';

interface WidgetPayload {
  isLoading: boolean;
  error: string | null;
  result: DataMartQueryResult | null;
  metricFormat?: MetricFormat;
}

function useWidgetPayload(widget: DataMartDashboardWidget): WidgetPayload {
  // staleTime: re-executing an analysis/metric always persists a run, so only
  // refetch when the user explicitly refreshes or revisits after a while.
  const analysisQuery = useQuery({
    queryKey: ['datamart', 'widget', widget.id, 'analysis'],
    queryFn: () => datamartApi.executeAnalysis(widget.analysisId!),
    enabled: Boolean(widget.analysisId),
    staleTime: 5 * 60_000,
  });

  const metricQuery = useQuery({
    queryKey: ['datamart', 'widget', widget.id, 'metric'],
    queryFn: () => datamartApi.executeMetric(widget.metricId!),
    enabled: Boolean(widget.metricId),
    staleTime: 5 * 60_000,
  });

  if (widget.metricId) {
    return {
      isLoading: metricQuery.isLoading,
      error: metricQuery.error
        ? describeDataMartError(toApiError(metricQuery.error)).message
        : null,
      result: metricQuery.data?.result ?? null,
      metricFormat: metricQuery.data?.metric.format,
    };
  }
  return {
    isLoading: analysisQuery.isLoading,
    error: analysisQuery.error
      ? describeDataMartError(toApiError(analysisQuery.error)).message
      : null,
    result: analysisQuery.data ?? null,
  };
}

/**
 * Renders a single dashboard widget by loading fresh data from its bound
 * analysis or metric, then displaying it per the configured widget type.
 */
export function WidgetRenderer({ widget }: { widget: DataMartDashboardWidget }) {
  const payload = useWidgetPayload(widget);

  if (payload.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (payload.error) {
    return <ErrorState title="Widget unavailable" message={payload.error} />;
  }

  if (!payload.result) {
    return <ErrorState title="Widget unavailable" message="This widget has no data source." />;
  }

  const { result } = payload;
  const isEmpty = result.rows.length === 0;

  if (widget.type === 'kpi') {
    return (
      <KpiWidget
        widget={widget}
        result={result}
        metricFormat={payload.metricFormat}
        fallbackTitle={widget.title}
      />
    );
  }

  if (widget.type === 'table') {
    return <ResultTable result={result} />;
  }

  if (widget.type === 'bar' || widget.type === 'line' || widget.type === 'area') {
    if (isEmpty) {
      return <ErrorState title="No data" message="This analysis returned no rows." />;
    }
    const chartType = widget.type === 'area' ? 'line' : widget.type;
    return <PinnedChart widget={widget} result={result} chartType={chartType} />;
  }

  if (widget.type === 'pie' || widget.type === 'scatter') {
    if (isEmpty) {
      return <ErrorState title="No data" message="This analysis returned no rows." />;
    }
    return <PinnedChart widget={widget} result={result} chartType={widget.type} />;
  }

  return <ResultTable result={result} />;
}

function KpiWidget({
  widget,
  result,
  metricFormat,
  fallbackTitle,
}: {
  widget: DataMartDashboardWidget;
  result: DataMartQueryResult;
  metricFormat?: MetricFormat;
  fallbackTitle: string;
}) {
  const valueKey = (widget.configuration?.valueKey as string | undefined) ?? '';
  const firstRow = result.rows[0];
  const firstValue = firstRow
    ? valueKey
      ? (firstRow[valueKey] ?? null)
      : Object.values(firstRow)[0]
    : null;
  const firstKey = firstRow
    ? valueKey
      ? valueKey
      : Object.keys(firstRow)[0]
    : null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wider text-slate-500">{firstKey ?? fallbackTitle}</p>
      <p className="text-3xl font-bold tabular-nums text-white">
        {firstValue !== null && firstValue !== undefined
          ? formatMetricValue(firstValue, metricFormat ?? 'number')
          : '—'}
      </p>
    </div>
  );
}

function PinnedChart({
  widget,
  result,
  chartType,
}: {
  widget: DataMartDashboardWidget;
  result: DataMartQueryResult;
  chartType: 'bar' | 'line' | 'pie' | 'scatter';
}) {
  const dimensions = result.columns.filter((column) => column.category !== 'metric');
  const lastMetric = result.columns[result.columns.length - 1];
  const metric =
    result.columns.find((column) => column.category === 'metric') ?? lastMetric;
  const xKey =
    (widget.configuration?.xKey as string | undefined) ??
    dimensions[0]?.name ??
    result.columns[0]?.name ??
    '';
  const yKey =
    (widget.configuration?.yKey as string | undefined) ??
    metric?.name ??
    lastMetric?.name ??
    '';

  if (chartType === 'bar') {
    const rec = recommendChart(result);
    return (
      <BarChart
        data={result.rows}
        xKey={xKey}
        yKey={yKey}
        horizontal={rec?.horizontal}
        height={260}
      />
    );
  }

  if (chartType === 'line') {
    return <LineChart data={result.rows} xKey={xKey} yKey={yKey} height={260} />;
  }

  if (chartType === 'pie') {
    const pieRows = result.rows
      .map((row) => ({
        name: String(row[xKey] ?? ''),
        value: typeof row[yKey] === 'number' ? (row[yKey] as number) : Number(row[yKey]) || 0,
      }))
      .filter((entry) => entry.name && Number.isFinite(entry.value));
    return <PieChart data={pieRows} height={260} />;
  }

  const points = result.rows
    .map((row) => ({
      x: Number(row[xKey]) || 0,
      y: Number(row[yKey]) || 0,
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  return <ScatterChart data={points} xName={xKey} yName={yKey} height={260} />;
}