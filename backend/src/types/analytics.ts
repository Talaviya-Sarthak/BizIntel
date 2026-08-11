/**
 * Centralized analytics domain types for the Dataset Intelligence Workspace.
 * Column categories, aggregation functions, filter operators and time
 * granularities are controlled enums — validated at the API boundary and
 * never interpolated into SQL unchecked.
 */

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

export const ANALYTICS_AGGREGATIONS = ['sum', 'avg', 'count', 'min', 'max'] as const;

export type AggregationFunction = (typeof ANALYTICS_AGGREGATIONS)[number];

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

export const FILTER_CONJUNCTIONS = ['AND', 'OR'] as const;

export type FilterConjunction = (typeof FILTER_CONJUNCTIONS)[number];

/** A single, validated comparison against one column. */
export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value?: unknown;
  value2?: unknown;
}

/** A (possibly nested) boolean tree of filter conditions. */
export type FilterNode = FilterCondition | FilterGroup;

export interface FilterGroup {
  conjunction: FilterConjunction;
  nodes: FilterNode[];
}

export interface GroupByRequest {
  groupBy: string;
  aggregation: AggregationFunction;
  metric?: string;
  topN?: number;
}

export interface ScatterRequest {
  x: string;
  y: string;
  /** Maximum number of sampled points to return (1–5000). */
  sample?: number;
}

export interface TimeSeriesRequest {
  dateColumn: string;
  metric?: string;
  aggregation: AggregationFunction;
  granularity: TimeGranularity;
}

export interface ExplorerRequest {
  columns?: string[];
  filters?: FilterNode;
  search?: { term: string; columns?: string[] };
  sort?: { column: string; direction: 'asc' | 'desc' };
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

/** Maps a DuckDB type name to a normalized analytics column category. */
export function classifyColumnCategory(raw: string): ColumnCategory {
  const type = raw.split('(')[0]!.trim().toUpperCase();

  if (
    ['INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'UTINYINT', 'USMALLINT',
      'UINTEGER', 'UBIGINT', 'HUGEINT', 'UHUGEINT'].includes(type)
  ) {
    return 'integer';
  }
  if (['FLOAT', 'REAL', 'DOUBLE'].includes(type)) return 'float';
  if (type === 'DECIMAL') return 'decimal';
  if (type === 'BOOLEAN') return 'boolean';
  if (type === 'DATE') return 'date';
  if (type === 'TIME') return 'time';
  if (type.startsWith('TIMESTAMP')) return 'datetime';
  if (type === 'UUID') return 'uuid';
  return 'string';
}

export function isNumericCategory(category: ColumnCategory): boolean {
  return category === 'integer' || category === 'float' || category === 'decimal';
}

export function isDateCategory(category: ColumnCategory): boolean {
  return category === 'date' || category === 'time' || category === 'datetime';
}

export function isCategoricalCategory(category: ColumnCategory): boolean {
  return category === 'string' || category === 'uuid' || category === 'boolean';
}

export function isAggregationFunction(value: unknown): value is AggregationFunction {
  return (
    typeof value === 'string' && (ANALYTICS_AGGREGATIONS as readonly string[]).includes(value)
  );
}

export function isFilterOperator(value: unknown): value is FilterOperator {
  return typeof value === 'string' && (FILTER_OPERATORS as readonly string[]).includes(value);
}

export function isTimeGranularity(value: unknown): value is TimeGranularity {
  return (
    typeof value === 'string' && (TIME_GRANULARITIES as readonly string[]).includes(value)
  );
}
