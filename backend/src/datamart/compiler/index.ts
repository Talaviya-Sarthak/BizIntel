import type { DatasetColumn } from '../../models/dataset.model.js';
import { csvTableRef, quoteIdent } from '../../services/duckdb.service.js';
import {
  classifyColumnCategory,
  isDateCategory,
  isNumericCategory,
  TIME_GRANULARITIES,
} from '../../types/analytics.js';
import { ApiError } from '../../utils/httpError.js';
import { buildFilterWhere } from '../../utils/filterSql.js';
import {
  AGGREGATION_FUNCTIONS,
  DATAMART_ERROR_CODES,
  NUMERIC_AGGREGATIONS,
  type DataMartAggregation,
  type DataMartJoin,
  type DataMartQuery,
  type DataMartSort,
} from '../types/index.js';
import { compileFormula, type FormulaContext } from './formula.js';

/**
 * DataMartQueryCompiler — the ONLY path from a structured `DataMartQuery` to
 * DuckDB SQL. It is a hard security boundary: no free-form SQL ever reaches
 * the engine. Every identifier is resolved against the dataset schema and
 * quoted; every value is a positional parameter; aggregations, granularities
 * and formula functions come from fixed whitelists.
 */

export interface DataMartDatasetSchema {
  id: string;
  name: string;
  storagePath: string | null;
  status: string;
  columns: DatasetColumn[];
}

/** Inject this loader so the compiler stays pure and unit-testable. */
export type DataMartSchemaLoader = (datasetId: string) => Promise<DataMartDatasetSchema>;

export interface DataMartOutputColumn {
  alias: string;
  name: string;
  type: string;
  category: string;
  kind: 'dimension' | 'metric';
}

export interface CompiledDataMartQuery {
  /** Grouped result query (includes ORDER BY / LIMIT / OFFSET). */
  dataSql: string;
  /** Total row count of the grouped result (before LIMIT/OFFSET). */
  countSql: string;
  /** Positional parameters for `dataSql` (filter values + limit + offset). */
  params: unknown[];
  /** Positional parameters for `countSql` (filter values only). */
  countParams: unknown[];
  /** Output columns in SELECT order, keyed by their SQL alias. */
  columns: DataMartOutputColumn[];
  datasets: { id: string; name: string }[];
}

export const DATAMART_MAX_LIMIT = 10_000;
export const DATAMART_DEFAULT_LIMIT = 1_000;
export const DATAMART_MAX_OFFSET = 100_000;

interface LoadedDataset {
  id: string;
  name: string;
  alias: string;
  storagePath: string;
  columns: DatasetColumn[];
}

interface ScopeEntry {
  prefix: string;
  column: DatasetColumn;
  datasetId: string;
}

export class DataMartQueryCompiler {
  async compile(
    query: DataMartQuery,
    loader: DataMartSchemaLoader,
  ): Promise<CompiledDataMartQuery> {
    if (!query.datasets || query.datasets.length === 0) {
      throw invalid('A query must reference at least one dataset');
    }

    const loads = await this.loadDatasets(query.datasets, loader);
    const scope = buildScope(loads);

    const joins = query.joins ?? [];
    const dimensions = query.dimensions ?? [];
    const metrics = query.metrics ?? [];
    const sort = query.sort ?? [];

    const joinsSql = this.buildJoins(joins, loads);

    const selectParts: string[] = [];
    const outputColumns: DataMartOutputColumn[] = [];
    const groupBy: string[] = [];

    dimensions.forEach((dimension, index) => {
      const alias = `__dm_d${index}`;
      const entry = resolveScope(scope, dimension.column);
      const category = classifyColumnCategory(entry.column.dataType);
      const qualified = qualify(entry);

      let expr: string;
      if (dimension.granularity) {
        if (!TIME_GRANULARITIES.includes(dimension.granularity)) {
          throw invalid(`Unsupported time granularity: "${dimension.granularity}"`);
        }
        if (!isDateCategory(category)) {
          throw invalid(
            `Time grouping requires a date column; "${dimension.column}" is ${entry.column.dataType}`,
          );
        }
        expr = `date_trunc('${dimension.granularity}', CAST(${qualified} AS TIMESTAMP))`;
      } else {
        expr = qualified;
      }

      selectParts.push(`${expr} AS ${alias}`);
      groupBy.push(alias);
      outputColumns.push({
        alias,
        name: dimension.column,
        type: entry.column.dataType,
        category,
        kind: 'dimension',
      });
    });

    const hasDimensions = dimensions.length > 0;

    metrics.forEach((metric, index) => {
      const alias = `__dm_m${index}`;
      let expr: string;

      if (metric.formula) {
        const formula = compileFormula(metric.formula, formulaContext(scope));
        if (hasDimensions && !formula.hasAggregation) {
          throw ApiError.badRequest(
            DATAMART_ERROR_CODES.INVALID_METRIC,
            `Formula metric "${metric.alias}" must include an aggregation when the query is grouped by dimensions`,
          );
        }
        expr = formula.sql;
      } else {
        if (!metric.aggregation) {
          throw invalid(
            `Metric "${metric.alias}" must define either an aggregation or a formula`,
          );
        }
        expr = buildAggregateExpression(metric.column, metric.aggregation, scope, metric.alias);
      }

      selectParts.push(`${expr} AS ${alias}`);
      outputColumns.push({
        alias,
        name: metric.alias,
        type: 'metric',
        category: 'metric',
        kind: 'metric',
      });
    });

    if (selectParts.length === 0) {
      throw invalid('A query must define at least one dimension or metric');
    }

    const filterSql = buildFilterWhere(query.filters, scopeColumns(scope), {
      resolveQualified: (name) => qualify(resolveScope(scope, name)),
    });

    const fromSql = `FROM ${csvTableRef(loads[0]!.storagePath)} AS ${loads[0]!.alias}${joinsSql}`;
    const whereSql =
      filterSql.clause !== '' ? ` WHERE ${filterSql.clause}` : '';
    const groupSql = groupBy.length > 0 ? ` GROUP BY ${groupBy.join(', ')}` : '';

    const innerSql = `SELECT ${selectParts.join(', ')}\n${fromSql}${whereSql}${groupSql}`;

    const orderSql = this.buildOrderBy(sort, scope, outputColumns);

    const limit = clampLimit(query.limit ?? DATAMART_DEFAULT_LIMIT);
    const offset = clampOffset(query.offset ?? 0);
    const dataSql = `${innerSql}\n${orderSql}\nLIMIT ? OFFSET ?`;
    const countSql = `SELECT count(*) AS n\nFROM (${innerSql}) AS __dm_total`;

    return {
      dataSql,
      countSql,
      params: [...filterSql.params, limit, offset],
      countParams: filterSql.params,
      columns: outputColumns,
      datasets: loads.map((load) => ({ id: load.id, name: load.name })),
    };
  }

  private async loadDatasets(
    datasetIds: string[],
    loader: DataMartSchemaLoader,
  ): Promise<LoadedDataset[]> {
    if (datasetIds.length > 8) {
      throw invalid('A query may join at most 8 datasets');
    }
    const seen = new Set<string>();
    const loads: LoadedDataset[] = [];
    for (let i = 0; i < datasetIds.length; i += 1) {
      const id = datasetIds[i]!;
      if (seen.has(id)) {
        throw invalid(`Dataset "${id}" is referenced more than once`);
      }
      seen.add(id);
      const schema = await loader(id);
      if (!schema || !schema.storagePath) {
        throw ApiError.badRequest(
          DATAMART_ERROR_CODES.NOT_READY,
          `Dataset is not ready for querying: "${id}"`,
          undefined,
          'Wait for the dataset to finish processing, then try again.',
        );
      }
      loads.push({
        id: schema.id,
        name: schema.name,
        alias: `d${i}`,
        storagePath: schema.storagePath,
        columns: schema.columns,
      });
    }
    return loads;
  }

  private buildJoins(joins: DataMartJoin[], loads: LoadedDataset[]): string {
    const byId = new Map(loads.map((load) => [load.id, load]));
    const parts: string[] = [];

    for (const join of joins) {
      const left = byId.get(join.leftDataset);
      const right = byId.get(join.rightDataset);
      if (!left || !right) {
        throw invalid('A join references a dataset that is not part of the query');
      }
      if (!['inner', 'left'].includes(join.type)) {
        throw invalid(`Unsupported join type: "${join.type}"`);
      }
      const leftColumn = findColumn(left.columns, join.leftColumn);
      const rightColumn = findColumn(right.columns, join.rightColumn);
      const operator = join.type === 'left' ? 'LEFT JOIN' : 'JOIN';
      parts.push(
        `\n${operator} ${csvTableRef(right.storagePath)} AS ${right.alias}` +
          ` ON ${left.alias}.${quoteIdent(leftColumn.columnName)} = ${right.alias}.${quoteIdent(rightColumn.columnName)}`,
      );
    }

    return parts.join('');
  }

  // -------------------------------------------------------------------------
  // Sorting: sorts must reference a selected dimension or metric so the ORDER
  // BY always matches a GROUP BY expression (avoids DuckDB errors and keeps
  // the sort key fully under the compiler's control).
  // -------------------------------------------------------------------------
  private buildOrderBy(
    sort: DataMartSort[],
    scope: Map<string, ScopeEntry[]>,
    outputColumns: DataMartOutputColumn[],
  ): string {
    if (sort.length === 0) return '';

    const orderByAlias = new Map<string, string>();
    for (const column of outputColumns) {
      orderByAlias.set(column.name, column.alias);
    }

    const parts = sort.map((sort) => {
      if (!['asc', 'desc'].includes(sort.direction)) {
        throw invalid(`Unsupported sort direction: "${sort.direction}"`);
      }
      const alias = orderByAlias.get(sort.column);
      if (!alias) {
        throw ApiError.badRequest(
          DATAMART_ERROR_CODES.INVALID_SORT,
          `Sort column must be a dimension or metric in the query: "${sort.column}"`,
        );
      }
      return `${alias} ${sort.direction === 'desc' ? 'DESC' : 'ASC'}`;
    });

    return `ORDER BY ${parts.join(', ')}`;
  }
}

// ---------------------------------------------------------------------------
// Scope resolution
// ---------------------------------------------------------------------------

function buildScope(loads: LoadedDataset[]): Map<string, ScopeEntry[]> {
  const scope = new Map<string, ScopeEntry[]>();
  for (const load of loads) {
    for (const column of load.columns) {
      const list = scope.get(column.columnName) ?? [];
      list.push({ prefix: load.alias, column, datasetId: load.id });
      scope.set(column.columnName, list);
    }
  }
  return scope;
}

/** Deduplicated column list used for value coercion / existence validation. */
function scopeColumns(scope: Map<string, ScopeEntry[]>): DatasetColumn[] {
  const columns: DatasetColumn[] = [];
  for (const entries of scope.values()) {
    columns.push(entries[0]!.column);
  }
  return columns;
}

function resolveScope(scope: Map<string, ScopeEntry[]>, name: string): ScopeEntry {
  const entries = scope.get(name);
  if (!entries || entries.length === 0) {
    throw ApiError.badRequest(
      DATAMART_ERROR_CODES.COLUMN_NOT_FOUND,
      `Column not found: "${name}"`,
    );
  }
  if (entries.length > 1) {
    throw ApiError.badRequest(
      DATAMART_ERROR_CODES.AMBIGUOUS_COLUMN,
      `Column "${name}" exists in multiple datasets; rename or qualify the columns to query them together`,
    );
  }
  return entries[0]!;
}

function qualify(entry: ScopeEntry): string {
  return `${entry.prefix}.${quoteIdent(entry.column.columnName)}`;
}

function findColumn(columns: DatasetColumn[], name: string): DatasetColumn {
  const column = columns.find((entry) => entry.columnName === name);
  if (!column) {
    throw ApiError.badRequest(
      DATAMART_ERROR_CODES.COLUMN_NOT_FOUND,
      `Column not found: "${name}"`,
    );
  }
  return column;
}

// ---------------------------------------------------------------------------
// Aggregates + formulas
// ---------------------------------------------------------------------------

function buildAggregateExpression(
  column: string | undefined,
  aggregation: DataMartAggregation,
  scope: Map<string, ScopeEntry[]>,
  alias: string,
): string {
  const fn = AGGREGATION_FUNCTIONS[aggregation];
  if (!fn) {
    throw invalid(`Unsupported aggregation: "${aggregation}"`);
  }

  if (aggregation === 'count') {
    if (!column) return 'count(*)';
    const entry = resolveScope(scope, column);
    return `count(${qualify(entry)})`;
  }

  if (!column) {
    throw invalid(`"${aggregation}" requires a column for metric "${alias}"`);
  }
  const entry = resolveScope(scope, column);
  if (isNumericAggregation(aggregation)) {
    const category = classifyColumnCategory(entry.column.dataType);
    if (!isNumericCategory(category)) {
      throw invalid(
        `"${aggregation}" requires a numeric column; "${column}" is ${entry.column.dataType}`,
      );
    }
  }

  if (aggregation === 'count_distinct') {
    return `count(DISTINCT ${qualify(entry)})`;
  }
  return `${fn}(${qualify(entry)})`;
}

function formulaContext(scope: Map<string, ScopeEntry[]>): FormulaContext {
  return {
    resolveColumnSql: (name: string): string | null => {
      const entries = scope.get(name);
      if (!entries || entries.length === 0) return null;
      if (entries.length > 1) {
        throw ApiError.badRequest(
          DATAMART_ERROR_CODES.AMBIGUOUS_COLUMN,
          `Column "${name}" exists in multiple datasets; rename or qualify the columns to query them together`,
        );
      }
      return qualify(entries[0]!);
    },
    isNumericColumn: (name: string): boolean => {
      const entries = scope.get(name);
      if (!entries || entries.length === 0) return false;
      return isNumericCategory(classifyColumnCategory(entries[0]!.column.dataType));
    },
  };
}

function isNumericAggregation(aggregation: DataMartAggregation): boolean {
  return (NUMERIC_AGGREGATIONS as readonly DataMartAggregation[]).includes(aggregation);
}

// ---------------------------------------------------------------------------
// Bounds + errors
// ---------------------------------------------------------------------------

function clampLimit(value: number): number {
  if (!Number.isFinite(value)) return DATAMART_DEFAULT_LIMIT;
  const truncated = Math.trunc(value);
  if (truncated <= 0) return 1;
  return Math.min(truncated, DATAMART_MAX_LIMIT);
}

function clampOffset(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.trunc(value), DATAMART_MAX_OFFSET);
}

function invalid(message: string): ApiError {
  return ApiError.badRequest(DATAMART_ERROR_CODES.INVALID_QUERY, message);
}