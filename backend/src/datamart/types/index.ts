/**
 * DataMart domain types.
 *
 * DataMart is the platform's reusable analytical layer: users build
 * structured queries, save them as analyses, promote reusable metrics (KPIs)
 * and arrange widgets on dashboards. Every query is expressed as structured
 * configuration — never free-form SQL — and compiled into safe DuckDB SQL by
 * the DataMartQueryCompiler at execution time.
 */
import type { FilterNode, TimeGranularity } from '../../types/analytics.js';

export type { FilterNode, TimeGranularity } from '../../types/analytics.js';

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

export const DATAMART_AGGREGATIONS = [
  'count',
  'count_distinct',
  'sum',
  'avg',
  'min',
  'max',
  'median',
  'stddev',
  'variance',
] as const;

export type DataMartAggregation = (typeof DATAMART_AGGREGATIONS)[number];

/** DuckDB function name for a DataMart aggregation (whitelist, compiler-side). */
export const AGGREGATION_FUNCTIONS: Record<DataMartAggregation, string> = {
  count: 'count',
  count_distinct: 'count',
  sum: 'sum',
  avg: 'avg',
  min: 'min',
  max: 'max',
  median: 'median',
  stddev: 'stddev',
  variance: 'variance',
};

/** Aggregations that require a numeric input column (rejected at compile time otherwise). */
export const NUMERIC_AGGREGATIONS: readonly DataMartAggregation[] = [
  'sum',
  'avg',
  'median',
  'stddev',
  'variance',
];

// ---------------------------------------------------------------------------
// Query model (structured, never SQL)
// ---------------------------------------------------------------------------

export interface DataMartDimension {
  column: string;
  /** For date/time/datetime columns: day | week | month | quarter | year. */
  granularity?: TimeGranularity;
}

export interface DataMartQueryMetric {
  /** Simple aggregation over a column, e.g. SUM(total_revenue). */
  column?: string;
  aggregation?: DataMartAggregation;
  /** Calculated metric in the safe expression grammar. */
  formula?: string;
  /** Stable output column name. */
  alias: string;
}

export interface DataMartJoin {
  type: 'inner' | 'left';
  /** Dataset id already part of the query (usually the base dataset). */
  leftDataset: string;
  leftColumn: string;
  rightDataset: string;
  rightColumn: string;
}

export interface DataMartSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DataMartQuery {
  /** Dataset ids; the first is the base table. */
  datasets: string[];
  dimensions: DataMartDimension[];
  metrics: DataMartQueryMetric[];
  filters?: FilterNode;
  joins?: DataMartJoin[];
  sort?: DataMartSort[];
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Metric definition (reusable KPI)
// ---------------------------------------------------------------------------

export type MetricDefinition =
  | { kind: 'aggregate'; column: string; aggregation: DataMartAggregation }
  | { kind: 'formula'; formula: string };

export type MetricFormat = 'number' | 'currency' | 'percent' | 'decimal' | 'compact';

export const METRIC_FORMATS = ['number', 'currency', 'percent', 'decimal', 'compact'] as const;

// ---------------------------------------------------------------------------
// Persisted models
// ---------------------------------------------------------------------------

export interface DataMartAnalysis {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  queryConfig: DataMartQuery;
  datasetIds: string[];
  tags: string[];
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataMartAnalysisRun {
  id: string;
  analysisId: string;
  userId: string;
  status: 'SUCCESS' | 'FAILED';
  executionTimeMs: number;
  rowsReturned: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface DataMartMetric {
  id: string;
  userId: string;
  datasetId: string;
  datasetName?: string;
  name: string;
  description: string | null;
  definition: MetricDefinition;
  format: MetricFormat;
  createdAt: string;
  updatedAt: string;
}

export type DataMartWidgetType =
  | 'kpi'
  | 'table'
  | 'bar'
  | 'line'
  | 'pie'
  | 'scatter'
  | 'area';

export const DATAMART_WIDGET_TYPES: DataMartWidgetType[] = [
  'kpi',
  'table',
  'bar',
  'line',
  'pie',
  'scatter',
  'area',
];

export type DataMartWidgetSize = 'full' | 'half' | 'third';

export interface DataMartDashboardWidget {
  id: string;
  dashboardId: string;
  type: DataMartWidgetType;
  title: string;
  analysisId: string | null;
  metricId: string | null;
  configuration: Record<string, unknown>;
  position: number;
  size: DataMartWidgetSize;
  createdAt: string;
}

export interface DataMartDashboard {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  layout: '1' | '2' | '3';
  createdAt: string;
  updatedAt: string;
}

export type DataMartDashboardDetail = DataMartDashboard & {
  widgets: DataMartDashboardWidget[];
};

// ---------------------------------------------------------------------------
// Query result
// ---------------------------------------------------------------------------

export interface DataMartResultColumn {
  name: string;
  type: string;
  category: string;
}

export interface DataMartQueryResult {
  columns: DataMartResultColumn[];
  rows: Record<string, unknown>[];
  totalRows: number;
  executionTimeMs: number;
  datasets: { id: string; name: string }[];
  query: DataMartQuery;
  truncated: boolean;
}

// ---------------------------------------------------------------------------
// Analysis history / overview
// ---------------------------------------------------------------------------

export interface DataMartOverview {
  datasets: {
    total: number;
    ready: number;
    failed: number;
    totalRows: number;
    totalColumns: number;
    fileTypes: { fileType: string; count: number }[];
  };
  analyses: {
    total: number;
    recent: DataMartAnalysis[];
  };
  metrics: {
    total: number;
    recent: DataMartMetric[];
  };
  dashboards: {
    total: number;
  };
  recentDatasets: {
    id: string;
    name: string;
    rowCount: number | null;
    status: string;
    createdAt: string;
  }[];
  recentRuns: {
    id: string;
    analysisId: string;
    analysisName: string;
    status: 'SUCCESS' | 'FAILED';
    executionTimeMs: number;
    createdAt: string;
  }[];
}

export interface DataMartComparison {
  datasets: {
    id: string;
    name: string;
    rowCount: number;
    columnCount: number;
    fileType: string;
    createdAt: string;
  }[];
  columns: {
    name: string;
    typeA: string | null;
    typeB: string | null;
    compatible: boolean;
  }[];
  compatible: boolean;
  summary: {
    metric: string;
    datasetA: number | null;
    datasetB: number | null;
  }[];
  sharedColumns: string[];
}

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export const DATAMART_ERROR_CODES = {
  DATASET_NOT_FOUND: 'DATAMART_DATASET_NOT_FOUND',
  COLUMN_NOT_FOUND: 'DATAMART_COLUMN_NOT_FOUND',
  INVALID_QUERY: 'DATAMART_INVALID_QUERY',
  INVALID_FILTER: 'DATAMART_INVALID_FILTER',
  INVALID_AGGREGATION: 'DATAMART_INVALID_AGGREGATION',
  INVALID_JOIN: 'DATAMART_INVALID_JOIN',
  INVALID_METRIC: 'DATAMART_INVALID_METRIC',
  QUERY_TIMEOUT: 'DATAMART_QUERY_TIMEOUT',
  QUERY_FAILED: 'DATAMART_QUERY_FAILED',
  LIMIT_EXCEEDED: 'DATAMART_LIMIT_EXCEEDED',
  ACCESS_DENIED: 'DATAMART_ACCESS_DENIED',
  NOT_FOUND: 'DATAMART_NOT_FOUND',
  NOT_READY: 'DATAMART_DATASET_NOT_READY',
  INVALID_SORT: 'DATAMART_INVALID_SORT',
  AMBIGUOUS_COLUMN: 'DATAMART_AMBIGUOUS_COLUMN',
} as const;

export type DataMartErrorCode = (typeof DATAMART_ERROR_CODES)[keyof typeof DATAMART_ERROR_CODES];
