import type { ApiSuccess } from '../../../types/auth';
import { api } from '../../../lib/api';
import type {
  DataMartAnalysis,
  DataMartAnalysisRun,
  DataMartComparison,
  DataMartCreateAnalysisInput,
  DataMartCreateDashboardInput,
  DataMartCreateMetricInput,
  DataMartCreateWidgetInput,
  DataMartDashboard,
  DataMartDashboardDetail,
  DataMartDashboardWidget,
  DataMartMetric,
  DataMartOverview,
  DataMartQuery,
  DataMartQueryResult,
  DataMartUpdateAnalysisInput,
  DataMartUpdateDashboardInput,
  DataMartUpdateMetricInput,
  DataMartUpdateWidgetInput,
  Paginated,
} from '../types';

interface ListOptions {
  limit?: number;
  offset?: number;
}

/** Query execution can take a while on large datasets. */
const EXECUTE_TIMEOUT = 120_000;

function queryString(options: ListOptions): string {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.offset !== undefined) params.set('offset', String(options.offset));
  const str = params.toString();
  return str ? `?${str}` : '';
}

/**
 * DataMart API service. Every endpoint the DataMart module exposes, in one
 * place, so pages only ever interact with typed, unwrapped responses.
 */
export const datamartApi = {
  // --- Query execution -----------------------------------------------------
  async executeQuery(query: DataMartQuery): Promise<DataMartQueryResult> {
    const { data } = await api.post<ApiSuccess<DataMartQueryResult>>(
      '/datamart/execute',
      { query },
      { timeout: EXECUTE_TIMEOUT },
    );
    return data.data;
  },

  async getOverview(): Promise<DataMartOverview> {
    const { data } = await api.get<ApiSuccess<DataMartOverview>>('/datamart/overview');
    return data.data;
  },

  async getComparison(datasetA: string, datasetB: string): Promise<DataMartComparison> {
    const { data } = await api.get<ApiSuccess<DataMartComparison>>(
      `/datamart/comparison?datasetA=${encodeURIComponent(datasetA)}&datasetB=${encodeURIComponent(datasetB)}`,
    );
    return data.data;
  },

  // --- Analyses ------------------------------------------------------------
  async listAnalyses(options: ListOptions = {}): Promise<Paginated<DataMartAnalysis>> {
    const { data } = await api.get<ApiSuccess<Paginated<DataMartAnalysis>>>(
      `/datamart/analyses${queryString(options)}`,
    );
    return data.data;
  },

  async getAnalysis(id: string): Promise<DataMartAnalysis> {
    const { data } = await api.get<ApiSuccess<DataMartAnalysis>>(`/datamart/analyses/${id}`);
    return data.data;
  },

  async createAnalysis(input: DataMartCreateAnalysisInput): Promise<DataMartAnalysis> {
    const { data } = await api.post<ApiSuccess<DataMartAnalysis>>('/datamart/analyses', input);
    return data.data;
  },

  async updateAnalysis(
    id: string,
    input: DataMartUpdateAnalysisInput,
  ): Promise<DataMartAnalysis> {
    const { data } = await api.patch<ApiSuccess<DataMartAnalysis>>(
      `/datamart/analyses/${id}`,
      input,
    );
    return data.data;
  },

  async deleteAnalysis(id: string): Promise<void> {
    await api.delete<ApiSuccess<null>>(`/datamart/analyses/${id}`);
  },

  async executeAnalysis(id: string): Promise<DataMartQueryResult> {
    const { data } = await api.post<ApiSuccess<DataMartQueryResult>>(
      `/datamart/analyses/${id}/execute`,
      undefined,
      { timeout: EXECUTE_TIMEOUT },
    );
    return data.data;
  },

  async listAnalysisRuns(
    id: string,
    options: ListOptions = {},
  ): Promise<Paginated<DataMartAnalysisRun>> {
    const { data } = await api.get<ApiSuccess<Paginated<DataMartAnalysisRun>>>(
      `/datamart/analyses/${id}/runs${queryString(options)}`,
    );
    return data.data;
  },

  // --- Metrics -------------------------------------------------------------
  async listMetrics(
    options: ListOptions & { datasetId?: string } = {},
  ): Promise<Paginated<DataMartMetric>> {
    const params = new URLSearchParams();
    if (options.limit !== undefined) params.set('limit', String(options.limit));
    if (options.offset !== undefined) params.set('offset', String(options.offset));
    if (options.datasetId) params.set('datasetId', options.datasetId);
    const str = params.toString();
    const { data } = await api.get<ApiSuccess<Paginated<DataMartMetric>>>(
      `/datamart/metrics${str ? `?${str}` : ''}`,
    );
    return data.data;
  },

  async getMetric(id: string): Promise<DataMartMetric> {
    const { data } = await api.get<ApiSuccess<DataMartMetric>>(`/datamart/metrics/${id}`);
    return data.data;
  },

  async createMetric(input: DataMartCreateMetricInput): Promise<DataMartMetric> {
    const { data } = await api.post<ApiSuccess<DataMartMetric>>('/datamart/metrics', input);
    return data.data;
  },

  async updateMetric(id: string, input: DataMartUpdateMetricInput): Promise<DataMartMetric> {
    const { data } = await api.patch<ApiSuccess<DataMartMetric>>(`/datamart/metrics/${id}`, input);
    return data.data;
  },

  async deleteMetric(id: string): Promise<void> {
    await api.delete<ApiSuccess<null>>(`/datamart/metrics/${id}`);
  },

  async executeMetric(id: string): Promise<{ metric: DataMartMetric; result: DataMartQueryResult }> {
    const { data } = await api.post<
      ApiSuccess<{ metric: DataMartMetric; result: DataMartQueryResult }>
    >(`/datamart/metrics/${id}/execute`, undefined, { timeout: EXECUTE_TIMEOUT });
    return data.data;
  },

  // --- Dashboards ----------------------------------------------------------
  async listDashboards(options: ListOptions = {}): Promise<Paginated<DataMartDashboard>> {
    const { data } = await api.get<ApiSuccess<Paginated<DataMartDashboard>>>(
      `/datamart/dashboards${queryString(options)}`,
    );
    return data.data;
  },

  async getDashboard(id: string): Promise<DataMartDashboardDetail> {
    const { data } = await api.get<ApiSuccess<DataMartDashboardDetail>>(`/datamart/dashboards/${id}`);
    return data.data;
  },

  async createDashboard(input: DataMartCreateDashboardInput): Promise<DataMartDashboard> {
    const { data } = await api.post<ApiSuccess<DataMartDashboard>>('/datamart/dashboards', input);
    return data.data;
  },

  async updateDashboard(
    id: string,
    input: DataMartUpdateDashboardInput,
  ): Promise<DataMartDashboard> {
    const { data } = await api.patch<ApiSuccess<DataMartDashboard>>(
      `/datamart/dashboards/${id}`,
      input,
    );
    return data.data;
  },

  async deleteDashboard(id: string): Promise<void> {
    await api.delete<ApiSuccess<null>>(`/datamart/dashboards/${id}`);
  },

  async createWidget(
    dashboardId: string,
    input: DataMartCreateWidgetInput,
  ): Promise<DataMartDashboardWidget> {
    const { data } = await api.post<ApiSuccess<DataMartDashboardWidget>>(
      `/datamart/dashboards/${dashboardId}/widgets`,
      input,
    );
    return data.data;
  },

  async updateWidget(
    dashboardId: string,
    widgetId: string,
    input: DataMartUpdateWidgetInput,
  ): Promise<DataMartDashboardWidget> {
    const { data } = await api.patch<ApiSuccess<DataMartDashboardWidget>>(
      `/datamart/dashboards/${dashboardId}/widgets/${widgetId}`,
      input,
    );
    return data.data;
  },

  async deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
    await api.delete<ApiSuccess<null>>(
      `/datamart/dashboards/${dashboardId}/widgets/${widgetId}`,
    );
  },

  async reorderWidgets(dashboardId: string, orderedIds: string[]): Promise<void> {
    await api.post<ApiSuccess<null>>(
      `/datamart/dashboards/${dashboardId}/widgets/reorder`,
      { orderedIds },
    );
  },
};
