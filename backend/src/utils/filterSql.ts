import type { DatasetColumn } from '../models/dataset.model';
import {
  classifyColumnCategory,
  isNumericCategory,
  type FilterCondition,
  type FilterNode,
} from '../types/analytics';
import { ApiError } from './httpError';
import { quoteIdent } from '../services/duckdb.service';

/**
 * Shared, safe filter SQL builder used by the Dataset Intelligence analytics
 * service AND the DataMart query compiler.
 *
 * Identifiers are validated against the actual dataset schema and quoted;
 * values are always returned as positional `?` parameters (never
 * interpolated). `prefix` qualifies identifiers for multi-table queries
 * (e.g. `d0."region"`).
 */
export interface FilterBuildOptions {
  /** Table alias to qualify identifiers, e.g. `d0`. */
  prefix?: string;
  /**
   * Per-name identifier resolver for multi-table queries where different
   * columns may live in different tables. When provided it takes precedence
   * over `prefix`. The resolver may throw for unknown/ambiguous columns.
   */
  resolveQualified?: (name: string) => string;
}

export function buildFilterWhere(
  node: FilterNode | undefined,
  columns: DatasetColumn[],
  options: FilterBuildOptions = {},
): { clause: string; params: unknown[] } {
  if (!node) return { clause: '', params: [] };
  if ('nodes' in node) {
    const parts = node.nodes.map((child) => buildFilterWhere(child, columns, options));
    const nonEmpty = parts.filter((part) => part.clause !== '');
    if (nonEmpty.length === 0) return { clause: '', params: [] };
    return {
      clause: `(${nonEmpty.map((part) => part.clause).join(` ${node.conjunction} `)})`,
      params: nonEmpty.flatMap((part) => part.params),
    };
  }
  return buildConditionWhere(node, columns, options);
}

export function buildConditionWhere(
  condition: FilterCondition,
  columns: DatasetColumn[],
  options: FilterBuildOptions = {},
): { clause: string; params: unknown[] } {
  const column = resolveColumn(columns, condition.column);
  const q = options.resolveQualified
    ? options.resolveQualified(column.columnName)
    : qualifiedIdent(column.columnName, options.prefix);
  const value = coerceFilterValue(column, condition.value);

  switch (condition.operator) {
    case 'eq':
      return { clause: `${q} = ?`, params: [value] };
    case 'neq':
      return { clause: `${q} IS DISTINCT FROM ?`, params: [value] };
    case 'gt':
      return { clause: `${q} > ?`, params: [value] };
    case 'gte':
      return { clause: `${q} >= ?`, params: [value] };
    case 'lt':
      return { clause: `${q} < ?`, params: [value] };
    case 'lte':
      return { clause: `${q} <= ?`, params: [value] };
    case 'contains':
      return {
        clause: `CAST(${q} AS VARCHAR) ILIKE '%' || ? || '%'`,
        params: [escapeLike(String(value ?? ''))],
      };
    case 'not_contains':
      return {
        clause: `NOT (CAST(${q} AS VARCHAR) ILIKE '%' || ? || '%')`,
        params: [escapeLike(String(value ?? ''))],
      };
    case 'is_null':
      return { clause: `${q} IS NULL`, params: [] };
    case 'is_not_null':
      return { clause: `${q} IS NOT NULL`, params: [] };
    case 'in':
    case 'not_in': {
      const values = Array.isArray(condition.value) ? condition.value : [condition.value];
      const coerced = values.map((entry) => coerceFilterValue(column, entry));
      const placeholders = coerced.map(() => '?').join(', ');
      const op = condition.operator === 'in' ? 'IN' : 'NOT IN';
      return { clause: `${q} ${op} (${placeholders})`, params: coerced };
    }
    case 'between':
      return {
        clause: `${q} BETWEEN ? AND ?`,
        params: [value, coerceFilterValue(column, condition.value2)],
      };
    default:
      throw ApiError.badRequest(
        'INVALID_FILTER_OPERATOR',
        `Unsupported filter operator: "${condition.operator}"`,
      );
  }
}

export function coerceFilterValue(column: DatasetColumn, value: unknown): unknown {
  const category = classifyColumnCategory(column.dataType);
  if (isNumericCategory(category)) {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  if (category === 'boolean') {
    return value === true || value === 'true' || value === 1 || value === '1';
  }
  return value;
}

export function escapeLike(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** Throws a clean COLUMN_NOT_FOUND if the name does not exist in the schema. */
export function resolveColumn(columns: DatasetColumn[], name: string): DatasetColumn {
  const column = columns.find((entry) => entry.columnName === name);
  if (!column) {
    throw ApiError.badRequest('COLUMN_NOT_FOUND', `Column not found: "${name}"`);
  }
  return column;
}

/** Builds `"col"` or `d0."col"` with safe identifier quoting. */
export function qualifiedIdent(name: string, prefix?: string): string {
  const quoted = quoteIdent(name);
  return prefix ? `${prefix}.${quoted}` : quoted;
}
