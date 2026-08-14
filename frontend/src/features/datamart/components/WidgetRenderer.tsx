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
      return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
          <div className="p-2.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-zinc-200">No matching data</p>
          <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
            This query executed cleanly but returned 0 rows. Verify that the dataset contains records and active filters match.
          </p>
          <span className="inline-block font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 mt-1">
            0 rows · {result.columns.length} columns available
          </span>
        </div>
      );
    }
    const chartType = widget.type === 'area' ? 'line' : widget.type;
    return <PinnedChart widget={widget} result={result} chartType={chartType} />;
  }

  if (widget.type === 'pie' || widget.type === 'scatter') {
    if (isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
          <div className="p-2.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-zinc-200">No matching data</p>
          <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
            This query returned 0 rows for chart visualization.
          </p>
        </div>
      );
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
    ? valueKey && valueKey in firstRow
      ? (firstRow[valueKey] ?? null)
      : Object.values(firstRow)[0]
    : null;
  const firstKey = firstRow
    ? valueKey && valueKey in firstRow
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
  const availableColumnNames = new Set(result.columns.map((c) => c.name));

  const rawXKey = widget.configuration?.xKey as string | undefined;
  const rawYKey = widget.configuration?.yKey as string | undefined;

  const validXKey = rawXKey && availableColumnNames.has(rawXKey) ? rawXKey : undefined;
  const validYKey = rawYKey && availableColumnNames.has(rawYKey) ? rawYKey : undefined;

  const dimensions = result.columns.filter((column) => column.category !== 'metric');
  const lastMetric = result.columns[result.columns.length - 1];
  const metric =
    result.columns.find((column) => column.category === 'metric') ?? lastMetric;

  const xKey =
    validXKey ??
    dimensions[0]?.name ??
    result.columns[0]?.name ??
    '';

  const yKey =
    validYKey ??
    (metric?.name && metric.name !== xKey ? metric.name : undefined) ??
    (lastMetric?.name && lastMetric.name !== xKey ? lastMetric.name : undefined) ??
    result.columns.find((c) => c.name !== xKey)?.name ??
    result.columns[0]?.name ??
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