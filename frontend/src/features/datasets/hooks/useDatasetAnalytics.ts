import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { datasetAnalyticsService } from '../services/datasetAnalytics.service';
import type {
  CorrelationRequest,
  ExplorerRequest,
  GroupByRequest,
  ScatterRequest,
  TimeSeriesRequest,
} from '../analytics/types';

const analyticsKey = (id: string, ...rest: (string | number)[]) =>
  ['dataset', id, 'analytics', ...rest] as const;

export const DATASET_ANALYTICS_QUERY_KEYS = {
  overview: (id: string) => analyticsKey(id, 'overview'),
  quality: (id: string) => analyticsKey(id, 'quality'),
  columns: (id: string) => analyticsKey(id, 'columns'),
  insights: (id: string) => analyticsKey(id, 'insights'),
  statistics: (id: string, column: string) => analyticsKey(id, 'column', column, 'statistics'),
  distribution: (id: string, column: string, buckets: number) =>
    analyticsKey(id, 'column', column, 'distribution', buckets),
  topValues: (id: string, column: string, top: number) =>
    analyticsKey(id, 'column', column, 'top-values', top),
  outliers: (id: string, column: string) => analyticsKey(id, 'column', column, 'outliers'),
  correlation: (id: string, body: CorrelationRequest) =>
    analyticsKey(id, 'correlation', JSON.stringify(body)),
  groupBy: (id: string, body: GroupByRequest) => analyticsKey(id, 'group-by', JSON.stringify(body)),
  timeSeries: (id: string, body: TimeSeriesRequest) =>
    analyticsKey(id, 'time-series', JSON.stringify(body)),
  scatter: (id: string, body: ScatterRequest) => analyticsKey(id, 'scatter', JSON.stringify(body)),
  explorer: (id: string, body: ExplorerRequest) => analyticsKey(id, 'explorer', JSON.stringify(body)),
};

export function useDatasetOverview(id: string | undefined) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.overview(id ?? ''),
    queryFn: () => datasetAnalyticsService.getOverview(id!),
    enabled: Boolean(id),
  });
}

export function useDatasetQuality(id: string | undefined) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.quality(id ?? ''),
    queryFn: () => datasetAnalyticsService.getQuality(id!),
    enabled: Boolean(id),
  });
}

export function useDatasetAnalyticsColumns(id: string | undefined) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.columns(id ?? ''),
    queryFn: () => datasetAnalyticsService.getColumns(id!),
    enabled: Boolean(id),
  });
}

export function useDatasetInsights(id: string | undefined) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.insights(id ?? ''),
    queryFn: () => datasetAnalyticsService.getInsights(id!),
    enabled: Boolean(id),
  });
}

export function useColumnStatistics(id: string | undefined, column: string | undefined) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.statistics(id ?? '', column ?? ''),
    queryFn: () => datasetAnalyticsService.getColumnStatistics(id!, column!),
    enabled: Boolean(id && column),
  });
}

export function useColumnDistribution(id: string | undefined, column: string | undefined, buckets = 30) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.distribution(id ?? '', column ?? '', buckets),
    queryFn: () => datasetAnalyticsService.getColumnDistribution(id!, column!, buckets),
    enabled: Boolean(id && column),
  });
}

export function useColumnTopValues(id: string | undefined, column: string | undefined, top = 10) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.topValues(id ?? '', column ?? '', top),
    queryFn: () => datasetAnalyticsService.getColumnTopValues(id!, column!, top),
    enabled: Boolean(id && column),
  });
}

export function useColumnOutliers(id: string | undefined, column: string | undefined) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.outliers(id ?? '', column ?? ''),
    queryFn: () => datasetAnalyticsService.getColumnOutliers(id!, column!),
    enabled: Boolean(id && column),
  });
}

export function useCorrelation(id: string | undefined, body: CorrelationRequest = {}) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.correlation(id ?? '', body),
    queryFn: () => datasetAnalyticsService.getCorrelation(id!, body),
    enabled: Boolean(id),
  });
}

export function useGroupBy(id: string | undefined, body: GroupByRequest | null) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.groupBy(id ?? '', body ?? { groupBy: '', aggregation: 'count' }),
    queryFn: () => datasetAnalyticsService.getGroupBy(id!, body!),
    enabled: Boolean(id && body),
  });
}

export function useTimeSeries(id: string | undefined, body: TimeSeriesRequest | null) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.timeSeries(id ?? '', body ?? { dateColumn: '', aggregation: 'sum', granularity: 'month' }),
    queryFn: () => datasetAnalyticsService.getTimeSeries(id!, body!),
    enabled: Boolean(id && body),
  });
}

export function useScatter(id: string | undefined, body: ScatterRequest | null) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.scatter(id ?? '', body ?? { x: '', y: '' }),
    queryFn: () => datasetAnalyticsService.getScatter(id!, body!),
    enabled: Boolean(id && body),
  });
}

export function useFilteredRows(id: string | undefined, body: ExplorerRequest | null) {
  return useQuery({
    queryKey: DATASET_ANALYTICS_QUERY_KEYS.explorer(id ?? '', body ?? {}),
    queryFn: () => datasetAnalyticsService.getFilteredRows(id!, body!),
    enabled: Boolean(id && body),
  });
}

// --- Extended hooks for Analysis Dashboard ---

export function useFullStatistics(id: string | undefined) {
  return useQuery({
    queryKey: analyticsKey(id ?? '', 'full-statistics'),
    queryFn: () => datasetAnalyticsService.getFullStatistics(id!),
    enabled: Boolean(id),
  });
}

export function useMissingValueAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: analyticsKey(id ?? '', 'missing-values'),
    queryFn: () => datasetAnalyticsService.getMissingValueAnalysis(id!),
    enabled: Boolean(id),
  });
}

export function useOutlierAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: analyticsKey(id ?? '', 'outliers'),
    queryFn: () => datasetAnalyticsService.getOutlierAnalysis(id!),
    enabled: Boolean(id),
  });
}

export function useBusinessInsights(id: string | undefined) {
  return useQuery({
    queryKey: analyticsKey(id ?? '', 'business-insights'),
    queryFn: () => datasetAnalyticsService.getBusinessInsights(id!),
    enabled: Boolean(id),
  });
}

export function useAISummary(id: string | undefined) {
  return useQuery({
    queryKey: analyticsKey(id ?? '', 'ai-summary'),
    queryFn: () => datasetAnalyticsService.getAISummary(id!),
    enabled: Boolean(id),
  });
}

/** Triggers a browser download of the dataset file through the authenticated API. */
export function useDownloadDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fallbackName }: { id: string; fallbackName: string }) => {
      const response = await api.get<Blob>(`/datasets/${id}/download`, {
        responseType: 'blob',
        timeout: 120_000,
      });
      const blob = response.data;
      const disposition = response.headers['content-disposition'] ?? '';
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      const filename = match?.[1] ?? fallbackName;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
