import { api } from '../../../lib/api';
import type { ApiSuccess } from '../../../types/auth';
import type {
  CorrelationRequest,
  CorrelationResult,
  ColumnStatistics,
  DatasetOverview,
  DatasetQuality,
  DistributionResult,
  ExplorerRequest,
  ExplorerResult,
  GroupByRequest,
  GroupByResult,
  Insight,
  OutlierResult,
  ScatterRequest,
  ScatterResult,
  TimeSeriesRequest,
  TimeSeriesResult,
  TopValuesResult,
} from '../analytics/types';
import type { AnalyticsColumn } from '../analytics/types';

/**
 * Dataset Intelligence Workspace analytics API service. All analytical
 * computation happens server-side (DuckDB); the browser only renders the
 * aggregated results returned here.
 */
export const datasetAnalyticsService = {
  async getOverview(id: string): Promise<DatasetOverview> {
    const { data } = await api.get<ApiSuccess<DatasetOverview>>(
      `/datasets/${id}/analytics/overview`,
    );
    return data.data;
  },

  async getQuality(id: string): Promise<DatasetQuality> {
    const { data } = await api.get<ApiSuccess<DatasetQuality>>(
      `/datasets/${id}/analytics/quality`,
    );
    return data.data;
  },

  async getColumns(id: string): Promise<{ datasetId: string; total: number; columns: AnalyticsColumn[] }> {
    const { data } = await api.get<ApiSuccess<{ datasetId: string; total: number; columns: AnalyticsColumn[] }>>(
      `/datasets/${id}/analytics/columns`,
    );
    return data.data;
  },

  async getInsights(id: string): Promise<{ insights: Insight[] }> {
    const { data } = await api.get<ApiSuccess<{ insights: Insight[] }>>(
      `/datasets/${id}/analytics/insights`,
    );
    return data.data;
  },

  async getColumnStatistics(id: string, column: string): Promise<ColumnStatistics> {
    const { data } = await api.get<ApiSuccess<ColumnStatistics>>(
      `/datasets/${id}/analytics/columns/${encodeURIComponent(column)}/statistics`,
    );
    return data.data;
  },

  async getColumnDistribution(id: string, column: string, buckets = 30): Promise<DistributionResult> {
    const { data } = await api.get<ApiSuccess<DistributionResult>>(
      `/datasets/${id}/analytics/columns/${encodeURIComponent(column)}/distribution?buckets=${buckets}`,
    );
    return data.data;
  },

  async getColumnTopValues(id: string, column: string, top = 10): Promise<TopValuesResult> {
    const { data } = await api.get<ApiSuccess<TopValuesResult>>(
      `/datasets/${id}/analytics/columns/${encodeURIComponent(column)}/top-values?top=${top}`,
    );
    return data.data;
  },

  async getColumnOutliers(id: string, column: string): Promise<OutlierResult> {
    const { data } = await api.get<ApiSuccess<OutlierResult>>(
      `/datasets/${id}/analytics/columns/${encodeURIComponent(column)}/outliers`,
    );
    return data.data;
  },

  async getCorrelation(id: string, body: CorrelationRequest = {}): Promise<CorrelationResult> {
    const { data } = await api.post<ApiSuccess<CorrelationResult>>(
      `/datasets/${id}/analytics/correlation`,
      body,
    );
    return data.data;
  },

  async getGroupBy(id: string, body: GroupByRequest): Promise<GroupByResult> {
    const { data } = await api.post<ApiSuccess<GroupByResult>>(
      `/datasets/${id}/analytics/group-by`,
      body,
    );
    return data.data;
  },

  async getTimeSeries(id: string, body: TimeSeriesRequest): Promise<TimeSeriesResult> {
    const { data } = await api.post<ApiSuccess<TimeSeriesResult>>(
      `/datasets/${id}/analytics/time-series`,
      body,
    );
    return data.data;
  },

  async getScatter(id: string, body: ScatterRequest): Promise<ScatterResult> {
    const { data } = await api.post<ApiSuccess<ScatterResult>>(
      `/datasets/${id}/analytics/scatter`,
      body,
    );
    return data.data;
  },

  async getFilteredRows(id: string, body: ExplorerRequest): Promise<ExplorerResult> {
    const { data } = await api.post<ApiSuccess<ExplorerResult>>(
      `/datasets/${id}/analytics/filter`,
      body,
    );
    return data.data;
  },
};
