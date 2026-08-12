import type {
  ColumnCategory,
  DataMartAggregation,
  DataMartQuery,
  FilterNode,
  QueryColumn,
  QueryDatasetSource,
  TimeGranularity,
} from '../types';
import { isDateCategory, isNumericCategory } from './category';

// ---------------------------------------------------------------------------
// Builder rows: stable local ids so React keys survive list edits
// ---------------------------------------------------------------------------

export interface DimensionRow {
  id: string;
  column: string;
  granularity?: TimeGranularity;
}

export interface MetricRow {
  id: string;
  /** Simple aggregation over a column. */
  column?: string;
  aggregation?: DataMartAggregation;
  /** Calculated metric in the safe expression grammar. */
  formula?: string;
  /** Stable output column name. */
  alias: string;
}

export interface JoinRow {
  id: string;
  type: 'inner' | 'left';
  leftDataset: string;
  leftColumn: string;
  rightDataset: string;
  rightColumn: string;
}

export interface SortRow {
  id: string;
  column: string;
  direction: 'asc' | 'desc';
}

export interface QueryBuilderState {
  datasetIds: string[];
  dimensions: DimensionRow[];
  metrics: MetricRow[];
  filters: FilterNode | null;
  joins: JoinRow[];
  sorts: SortRow[];
  limit: number;
  offset: number;
}

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

let counter = 0;
export function newId(): string {
  counter += 1;
  return `dm-${Date.now().toString(36)}-${counter}`;
}

export function createEmptyQueryState(): QueryBuilderState {
  return {
    datasetIds: [],
    dimensions: [],
    metrics: [],
    filters: null,
    joins: [],
    sorts: [],
    limit: 1000,
    offset: 0,
  };
}

export function buildDataMartQuery(state: QueryBuilderState): DataMartQuery {
  return {
    datasets: state.datasetIds,
    dimensions: state.dimensions
      .filter((dimension) => dimension.column)
      .map((dimension) => ({
        column: dimension.column,
        ...(dimension.granularity ? { granularity: dimension.granularity } : {}),
      })),
    metrics: state.metrics
      .filter((metric) => metric.column || metric.formula)
      .map((metric) => ({
        ...(metric.column ? { column: metric.column } : {}),
        ...(metric.aggregation ? { aggregation: metric.aggregation } : {}),
        ...(metric.formula ? { formula: metric.formula } : {}),
        alias: metric.alias,
      })),
    ...(state.filters ? { filters: state.filters } : {}),
    ...(state.joins.length > 0 ? { joins: state.joins } : {}),
    ...(state.sorts.length > 0 ? { sorts: state.sorts } : {}),
    limit: state.limit,
    offset: state.offset,
  };
}

// ---------------------------------------------------------------------------
// Column resolution helpers
// ---------------------------------------------------------------------------

/** All distinct column names across the given sources, deduped by name. */
export function collectColumns(sources: QueryDatasetSource[]): QueryColumn[] {
  const byName = new Map<string, QueryColumn>();
  for (const source of sources) {
    for (const column of source.columns) {
      const existing = byName.get(column.name);
      if (existing) {
        byName.set(column.name, {
          ...existing,
          datasetIds: [...new Set([...existing.datasetIds, source.id])],
        });
      } else {
        byName.set(column.name, column);
      }
    }
  }
  return [...byName.values()];
}

/** Column names usable as dimensions for a given set of sources. */
export function dimensionCandidates(sources: QueryDatasetSource[]): QueryColumn[] {
  return collectColumns(sources);
}

/** Column names usable as numeric metric inputs (integer/float/decimal). */
export function metricCandidates(sources: QueryDatasetSource[]): QueryColumn[] {
  return collectColumns(sources).filter((column) => isNumericCategory(column.category));
}

/** Date-like columns (valid for time grouping). */
export function dateCandidates(sources: QueryDatasetSource[]): QueryColumn[] {
  return collectColumns(sources).filter((column) => isDateCategory(column.category));
}

export function columnCategory(
  sources: QueryDatasetSource[],
  name: string,
): QueryColumn | undefined {
  return collectColumns(sources).find((column) => column.name === name);
}

export function columnIsAmbiguous(sources: QueryDatasetSource[], name: string): boolean {
  const column = columnCategory(sources, name);
  return Boolean(column && column.datasetIds.length > 1);
}

export function isDateColumn(category: ColumnCategory | string): boolean {
  return isDateCategory(category as ColumnCategory);
}

export function isNumericColumn(category: ColumnCategory | string): boolean {
  return isNumericCategory(category as ColumnCategory);
}

// ---------------------------------------------------------------------------
// Client-side validation (mirrors the backend compiler's rules so users get
// feedback before a round trip)
// ---------------------------------------------------------------------------

export function validateQuery(
  state: QueryBuilderState,
  sources: QueryDatasetSource[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const selectedIds = new Set(state.datasetIds);
  const selectedSources = sources.filter((source) => selectedIds.has(source.id));

  if (state.datasetIds.length === 0) {
    issues.push({ level: 'error', message: 'Select at least one dataset to query.' });
  }

  const columns = collectColumns(selectedSources);

  if (state.datasetIds.length > 1) {
    const ambiguous = columns.filter((column) => column.datasetIds.length > 1);
    if (ambiguous.length > 0) {
      issues.push({
        level: 'warning',
        message: `Column${ambiguous.length > 1 ? 's' : ''} ${ambiguous
          .slice(0, 3)
          .map((column) => `"${column.name}"`)
          .join(', ')}${ambiguous.length > 3 ? '…' : ''} exist in multiple datasets — references to them will be rejected as ambiguous.`,
      });
    }
  }

  const dimensionNames = new Set(state.dimensions.filter((d) => d.column).map((d) => d.column));
  for (const dimension of state.dimensions) {
    if (!dimension.column) {
      issues.push({ level: 'error', message: 'Every dimension needs a column.' });
      continue;
    }
    if (!columns.some((column) => column.name === dimension.column)) {
      issues.push({
        level: 'error',
        message: `Dimension column "${dimension.column}" does not exist in the selected datasets.`,
      });
      continue;
    }
    if (dimension.granularity) {
      const column = columnCategory(selectedSources, dimension.column);
      if (column && !isDateCategory(column.category)) {
        issues.push({
          level: 'error',
          message: `Time grouping requires a date column; "${dimension.column}" is ${column.type}.`,
        });
      }
    }
  }

  if (state.metrics.length === 0) {
    issues.push({
      level: 'error',
      message: 'Add at least one metric (an aggregation or a formula) to see results.',
    });
  }

  const aliases = new Set<string>();
  for (const metric of state.metrics) {
    if (!metric.alias) {
      issues.push({ level: 'error', message: 'Every metric needs an output name (alias).' });
      continue;
    }
    if (aliases.has(metric.alias)) {
      issues.push({ level: 'error', message: `Metric alias "${metric.alias}" is used more than once.` });
    }
    aliases.add(metric.alias);

    if (metric.formula) {
      // The formula grammar is validated server-side; a cheap structural check
      // here catches empty or unbalanced expressions early.
      const opens = (metric.formula.match(/\(/g) ?? []).length;
      const closes = (metric.formula.match(/\)/g) ?? []).length;
      if (opens !== closes) {
        issues.push({
          level: 'error',
          message: `Formula in "${metric.alias}" has unbalanced parentheses.`,
        });
      }
    } else if (metric.column && metric.aggregation) {
      if (
        ['sum', 'avg', 'median', 'stddev', 'variance'].includes(metric.aggregation) &&
        !isNumericCategory(columnCategory(selectedSources, metric.column)?.category ?? 'string')
      ) {
        issues.push({
          level: 'error',
          message: `"${metric.aggregation}" requires a numeric column; "${metric.column}" is not numeric.`,
        });
      }
      if (!columns.some((column) => column.name === metric.column)) {
        issues.push({
          level: 'error',
          message: `Metric column "${metric.column}" does not exist in the selected datasets.`,
        });
      }
    } else {
      issues.push({
        level: 'error',
        message: 'Each metric needs a column + aggregation, or a formula.',
      });
    }
  }

  for (const join of state.joins) {
    const bothSelected = selectedIds.has(join.leftDataset) && selectedIds.has(join.rightDataset);
    if (!bothSelected) {
      issues.push({
        level: 'error',
        message: 'Every join must reference two datasets that are part of the query.',
      });
      continue;
    }
    const left = sources.find((source) => source.id === join.leftDataset);
    const right = sources.find((source) => source.id === join.rightDataset);
    if (!left || !right) continue;
    if (!left.columns.some((column) => column.name === join.leftColumn)) {
      issues.push({
        level: 'error',
        message: `Join column "${join.leftColumn}" does not exist in "${left.name}".`,
      });
    }
    if (!right.columns.some((column) => column.name === join.rightColumn)) {
      issues.push({
        level: 'error',
        message: `Join column "${join.rightColumn}" does not exist in "${right.name}".`,
      });
    }
  }

  for (const sort of state.sorts) {
    const isDimension = dimensionNames.has(sort.column);
    const isMetric = state.metrics.some((metric) => metric.alias === sort.column);
    if (!isDimension && !isMetric) {
      issues.push({
        level: 'error',
        message: `Sort column "${sort.column}" must be a dimension or a metric in the query.`,
      });
    }
  }

  if (state.limit < 1 || state.limit > 10000) {
    issues.push({ level: 'error', message: 'Limit must be between 1 and 10,000.' });
  }
  if (state.offset < 0 || state.offset > 100000) {
    issues.push({ level: 'error', message: 'Offset must be between 0 and 100,000.' });
  }

  return issues;
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.level === 'error');
}
