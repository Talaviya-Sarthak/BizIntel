export type ColumnCategory =
  | 'integer'
  | 'float'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'time'
  | 'datetime'
  | 'uuid'
  | 'string';

export type AggregationFunction = 'sum' | 'avg' | 'count' | 'min' | 'max';

export const FILTER_OPERATORS = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'not_contains',
  'in',
  'not_in',
  'is_null',
  'is_not_null',
  'between',
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export const TIME_GRANULARITIES = ['day', 'week', 'month', 'quarter', 'year'] as const;

export type TimeGranularity = (typeof TIME_GRANULARITIES)[number];

export type FilterConjunction = 'AND' | 'OR';

// --- Responses --------------------------------------------------------------

export interface AnalyticsColumn {
  name: string;
  type: string;
  category: ColumnCategory;
  nullable: boolean;
}

export interface DatasetOverview {
  datasetId: string;
  rowCount: number;
  columnCount: number;
  numericColumns: number;
  categoricalColumns: number;
  dateColumns: number;
  booleanColumns: number;
  byCategory: { category: ColumnCategory; count: number }[];
  missingValues: number;
  missingPercent: number;
  duplicateRows: number;
  duplicatePercent: number;
}

export interface QualityColumnRow {
  column: string;
  type: string;
  category: ColumnCategory;
  missing: number;
  missingPct: number;
  unique: number;
  uniquePct: number;
  invalid: number;
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface HealthReason {
  level: 'good' | 'warning';
  title: string;
  detail: string;
}

export interface DatasetQuality {
  datasetId: string;
  rowCount: number;
  columnCount: number;
  missingValues: number;
  missingPercent: number;
  duplicateRows: number;
  duplicatePercent: number;
  invalidValues: number;
  invalidPercent: number;
  typeConsistency: number;
  healthScore: number;
  reasons: HealthReason[];
  columns: QualityColumnRow[];
}

export interface NumericStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stddev: number;
  variance: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface ColumnStatistics {
  column: string;
  type: string;
  category: ColumnCategory;
  count: number;
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  uniquePercent: number;
  numeric?: NumericStatistics;
  boolean?: { trueCount: number; falseCount: number };
  date?: { min: string | null; max: string | null; rangeDays: number | null };
  categorical?: { distinctCount: number; topValues: TopValue[] };
}

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
}

export type DistributionResult =
  | {
      kind: 'histogram';
      column: string;
      type: string;
      category: ColumnCategory;
      buckets: HistogramBucket[];
      stats: { min: number; max: number; nonNull: number };
    }
  | {
      kind: 'categorical';
      column: string;
      type: string;
      category: ColumnCategory;
      topValues: TopValue[];
    };

export interface TopValue {
  value: unknown;
  count: number;
  percent: number;
}

export interface TopValuesResult {
  column: string;
  type: string;
  category: ColumnCategory;
  total: number;
  topValues: TopValue[];
}

export interface OutlierResult {
  column: string;
  method: 'IQR';
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outlierCount: number;
  outlierPercent: number;
  totalRows: number;
}

export interface CorrelationPair {
  columnA: string;
  columnB: string;
  correlation: number | null;
}

export interface CorrelationResult {
  columns: string[];
  pairs: CorrelationPair[];
  matrix: (number | null)[][];
  truncated: boolean;
}

export interface GroupByResult {
  groupBy: string;
  aggregation: AggregationFunction;
  metric: string | null;
  topN: number;
  rows: { key: unknown; value: number }[];
}

export interface TimeSeriesPoint {
  period: string;
  label: string;
  value: number;
}

export interface TimeSeriesResult {
  dateColumn: string;
  granularity: TimeGranularity;
  aggregation: AggregationFunction;
  metric: string | null;
  points: TimeSeriesPoint[];
}

export interface ScatterResult {
  x: string;
  y: string;
  total: number;
  sampled: number;
  sampledRatio: number;
  points: { x: number; y: number }[];
}

export interface ExplorerColumn {
  name: string;
  type: string;
  category: ColumnCategory;
}

export interface ExplorerResult {
  columns: ExplorerColumn[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  truncated: boolean;
}

export type InsightType =
  | 'DATA_QUALITY'
  | 'TREND'
  | 'CORRELATION'
  | 'OUTLIER'
  | 'DISTRIBUTION'
  | 'CATEGORY';

export type InsightSeverity = 'INFO' | 'LOW' | 'WARNING' | 'GOOD';

export interface Insight {
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

// --- Requests ---------------------------------------------------------------

export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value?: unknown;
  value2?: unknown;
}

export interface FilterGroup {
  conjunction: FilterConjunction;
  nodes: FilterNode[];
}

export type FilterNode = FilterCondition | FilterGroup;

export interface ExplorerRequest {
  columns?: string[];
  filters?: FilterNode;
  search?: { term: string; columns?: string[] };
  sort?: { column: string; direction: 'asc' | 'desc' };
  page?: number;
  pageSize?: number;
}

export interface GroupByRequest {
  groupBy: string;
  aggregation: AggregationFunction;
  metric?: string;
  topN?: number;
}

export interface TimeSeriesRequest {
  dateColumn: string;
  metric?: string;
  aggregation: AggregationFunction;
  granularity: TimeGranularity;
}

export interface ScatterRequest {
  x: string;
  y: string;
  sample?: number;
}

export interface CorrelationRequest {
  columns?: string[];
}

// --- Category helpers -------------------------------------------------------

export function isNumericCategory(category: ColumnCategory): boolean {
  return category === 'integer' || category === 'float' || category === 'decimal';
}

export function isDateCategory(category: ColumnCategory): boolean {
  return category === 'date' || category === 'time' || category === 'datetime';
}

export function isCategoricalCategory(category: ColumnCategory): boolean {
  return category === 'string' || category === 'uuid' || category === 'boolean';
}

// --- Extended types for Analysis Dashboard ---

export interface FullColumnStatistics {
  column: string;
  type: string;
  category: ColumnCategory;
  count: number;
  nullCount: number;
  nullPercent: number;
  uniqueCount: number;
  uniquePercent: number;
  numeric?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    mode: number;
    stddev: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    range: number;
    iqr: number;
    q1: number;
    q3: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  categorical?: {
    distinctCount: number;
    topValues: TopValue[];
    rareCategories: TopValue[];
    cardinality: number;
  };
  date?: { min: string | null; max: string | null; rangeDays: number | null };
  boolean?: { trueCount: number; falseCount: number };
}

export interface MissingValueAnalysis {
  totalCells: number;
  totalMissing: number;
  totalMissingPercent: number;
  columns: {
    column: string;
    missing: number;
    missingPercent: number;
    rank: number;
  }[];
  recommendations: {
    column: string;
    action: string;
    reason: string;
  }[];
}

export interface OutlierAnalysis {
  columns: {
    column: string;
    method: 'IQR' | 'ZSCORE';
    q1: number;
    q3: number;
    iqr: number;
    lowerBound: number;
    upperBound: number;
    outlierCount: number;
    outlierPercent: number;
    totalRows: number;
    zScoreOutliers?: number;
  }[];
  summary: {
    totalOutliers: number;
    columnsWithOutliers: number;
    worstColumn: string | null;
  };
}

export interface BusinessInsight {
  type: string;
  title: string;
  description: string;
  metric?: string;
  value?: unknown;
  impact: 'high' | 'medium' | 'low';
}

export interface AISummary {
  executiveSummary: string;
  keyInsights: string[];
  recommendations: string[];
  risks: string[];
  suggestedAnalysis: string[];
  generatedAt: string;
}
