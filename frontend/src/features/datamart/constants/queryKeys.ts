export const DATAMART_QUERY_KEYS = {
  overview: ['datamart', 'overview'] as const,
  sources: ['datamart', 'sources'] as const,
  comparison: (datasetA: string, datasetB: string) =>
    ['datamart', 'comparison', datasetA, datasetB] as const,
  analyses: ['datamart', 'analyses'] as const,
  analysis: (id: string) => ['datamart', 'analyses', id] as const,
  analysisRuns: (id: string) => ['datamart', 'analyses', id, 'runs'] as const,
  metrics: ['datamart', 'metrics'] as const,
  metric: (id: string) => ['datamart', 'metrics', id] as const,
  dashboards: ['datamart', 'dashboards'] as const,
  dashboard: (id: string) => ['datamart', 'dashboards', id] as const,
};
