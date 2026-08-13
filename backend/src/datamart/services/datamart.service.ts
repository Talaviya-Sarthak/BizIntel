import type { DatasetColumn } from '../../models/dataset.model';
import { findByIdAndUser as findDatasetByIdAndUser } from '../../repositories/dataset.repository';
import { listByDatasetId as listDatasetColumns } from '../../repositories/datasetColumn.repository';
import { storageService } from '../../services/storage.service';
import { csvTableRef, duckdbService, quoteIdent } from '../../services/duckdb.service';
import {
  classifyColumnCategory,
  isDateCategory,
  isNumericCategory,
  type ColumnCategory,
} from '../../types/analytics';
import { ApiError } from '../../utils/httpError';
import {
  DATAMART_DEFAULT_LIMIT,
  DATAMART_MAX_LIMIT,
  DATAMART_MAX_OFFSET,
  DataMartQueryCompiler,
  type DataMartDatasetSchema,
  type CompiledDataMartQuery,
} from '../compiler';
import { compileFormula, type FormulaContext } from '../compiler/formula';
import { datamartRepository } from '../repositories/datamart.repository';
import {
  DATAMART_ERROR_CODES,
  NUMERIC_AGGREGATIONS,
  type DataMartAnalysis,
  type DataMartComparison,
  type DataMartDashboard,
  type DataMartDashboardDetail,
  type DataMartMetric,
  type DataMartOverview,
  type DataMartQuery,
  type DataMartQueryResult,
  type DataMartResultColumn,
  type MetricDefinition,
} from '../types';
import type {
  CreateDashboardInput,
  CreateMetricInput,
  CreateWidgetInput,
  RunRowRecent,
  UpdateDashboardInput,
  UpdateMetricInput,
  UpdateWidgetInput,
} from '../repositories/datamart.repository';

const compiler = new DataMartQueryCompiler();

/**
 * HTTP contract for creating an analysis. Mirrors `createAnalysisSchema` —
 * the query travels under `query` (repository persistence uses `queryConfig`).
 */
interface CreateAnalysisInput {
  name: string;
  description?: string | null;
  query: DataMartQuery;
  tags: string[];
}

/** HTTP contract for updating an analysis. Mirrors `updateAnalysisSchema`. */
interface UpdateAnalysisInput {
  name?: string;
  description?: string | null;
  query?: DataMartQuery;
  tags?: string[];
}

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

function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

/** Resolves a dataset and returns the schema shape the compiler needs. */
async function loadSchema(userId: string, datasetId: string): Promise<DataMartDatasetSchema> {
  const dataset = await findDatasetByIdAndUser(datasetId, userId);
  if (!dataset) {
    throw ApiError.notFound(
      DATAMART_ERROR_CODES.DATASET_NOT_FOUND,
      'Dataset not found',
      undefined,
      'Pick a dataset from your library and try again.',
    );
  }
  if (dataset.status !== 'READY' || !dataset.storagePath) {
    throw ApiError.conflict(
      DATAMART_ERROR_CODES.NOT_READY,
      'This dataset is not ready for querying yet',
      undefined,
      'Wait for the dataset to finish processing, then try again.',
    );
  }
  return {
    id: dataset.id,
    name: dataset.name,
    storagePath: await storageService.acquireLocalPath(dataset.storagePath),
    status: dataset.status,
    columns: await listDatasetColumns(dataset.id),
  };
}

/** Renames internal SQL aliases to the user-facing output column names. */
function remapRows(
  rows: Record<string, unknown>[],
  columns: CompiledDataMartQuery['columns'],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const column of columns) {
      const value = row[column.alias];
      if (column.name in out) {
        out[column.alias] = value;
      } else {
        out[column.name] = value;
      }
    }
    return out;
  });
}

function resultColumns(columns: CompiledDataMartQuery['columns']): DataMartResultColumn[] {
  return columns.map((column) => ({
    name: column.name,
    type: column.type,
    category: column.category,
  }));
}

/** Runs the compiled DuckDB SQL + total-count query. */
async function runCompiled(
  basePath: string,
  compiled: CompiledDataMartQuery,
  query: DataMartQuery,
): Promise<{ rows: Record<string, unknown>[]; totalRows: number }> {
  const limit = clampLimit(query.limit ?? DATAMART_DEFAULT_LIMIT);
  const offset = clampOffset(query.offset ?? 0);

  let dataRows: Record<string, unknown>[];
  try {
    dataRows = await duckdbService.runQuery(basePath, compiled.dataSql, compiled.params);
  } catch (error) {
    throw ApiError.badRequest(
      DATAMART_ERROR_CODES.QUERY_FAILED,
      'The query could not be executed against the dataset',
      undefined,
      'Review the query settings and try again.',
    );
  }

  // If fewer rows came back than the limit, we already know the exact total.
  let totalRows: number;
  if (dataRows.length < limit) {
    totalRows = offset + dataRows.length;
  } else {
    try {
      const counts = await duckdbService.runQuery(basePath, compiled.countSql, compiled.countParams);
      totalRows = Number(counts[0]?.n ?? offset + dataRows.length);
    } catch {
      totalRows = offset + dataRows.length;
    }
  }

  return { rows: remapRows(dataRows, compiled.columns), totalRows };
}

/** Loads a dataset row only — no schema/columns — for ownership checks. */
async function requireDataset(userId: string, datasetId: string): Promise<void> {
  const dataset = await findDatasetByIdAndUser(datasetId, userId);
  if (!dataset) {
    throw ApiError.notFound(
      DATAMART_ERROR_CODES.DATASET_NOT_FOUND,
      'Dataset not found',
      undefined,
      'Pick a dataset from your library and try again.',
    );
  }
  if (dataset.status !== 'READY' || !dataset.storagePath) {
    throw ApiError.conflict(
      DATAMART_ERROR_CODES.NOT_READY,
      'This dataset is not ready yet',
      undefined,
      'Wait for the dataset to finish processing, then try again.',
    );
  }
}

export const datamartService = {
  // --- Query execution -----------------------------------------------------

  async executeQuery(userId: string, query: DataMartQuery): Promise<DataMartQueryResult> {
    const start = Date.now();
    const firstId = query.datasets[0]!;
    await requireDataset(userId, firstId);
    const baseSchema = await loadSchema(userId, firstId);

    const compiled = await compiler.compile(query, (datasetId) => loadSchema(userId, datasetId));
    const { rows, totalRows } = await runCompiled(baseSchema.storagePath!, compiled, query);

    return {
      columns: resultColumns(compiled.columns),
      rows,
      totalRows,
      executionTimeMs: Date.now() - start,
      datasets: compiled.datasets,
      query,
      truncated: rows.length < totalRows,
    };
  },

  // --- Analyses ------------------------------------------------------------

  async createAnalysis(
    userId: string,
    input: CreateAnalysisInput,
  ): Promise<DataMartAnalysis> {
    if (input.query.datasets.length === 0) {
      throw ApiError.badRequest(
        DATAMART_ERROR_CODES.INVALID_QUERY,
        'An analysis must reference at least one dataset',
      );
    }
    await requireDataset(userId, input.query.datasets[0]!);
    // Compile without executing: resolves every identifier and validates the
    // metric/formula definitions against the current schema, cheaply.
    await compiler.compile(input.query, (datasetId) => loadSchema(userId, datasetId));
    const analysis = await datamartRepository.createAnalysis({
      userId,
      name: input.name,
      description: input.description ?? null,
      queryConfig: input.query,
      datasetIds: input.query.datasets,
      tags: input.tags,
    });
    return analysis;
  },

  async listAnalyses(userId: string, options: { limit?: number; offset?: number } = {}) {
    const items = await datamartRepository.listAnalysesByUser(userId, options);
    return { items, total: await datamartRepository.countAnalysesByUser(userId) };
  },

  async getAnalysis(userId: string, id: string): Promise<DataMartAnalysis> {
    const analysis = await datamartRepository.findAnalysisByIdAndUser(id, userId);
    if (!analysis) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Analysis not found',
        undefined,
        'The analysis may have been deleted, or the link is invalid.',
      );
    }
    return analysis;
  },

  async updateAnalysis(
    userId: string,
    id: string,
    input: UpdateAnalysisInput,
  ): Promise<DataMartAnalysis> {
    const analysis = await this.getAnalysis(userId, id);
    const updated = await datamartRepository.updateAnalysis(analysis.id, userId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.query !== undefined
        ? { queryConfig: input.query, datasetIds: input.query.datasets }
        : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    });
    if (!updated) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Analysis not found',
        undefined,
        'The analysis may have been deleted, or the link is invalid.',
      );
    }
    return updated;
  },

  async deleteAnalysis(userId: string, id: string): Promise<void> {
    await this.getAnalysis(userId, id);
    await datamartRepository.deleteAnalysisById(id);
  },

  /** Executes a saved analysis against current dataset data and records a run. */
  async executeAnalysis(userId: string, id: string): Promise<DataMartQueryResult> {
    const analysis = await this.getAnalysis(userId, id);
    const startedAt = new Date();
    const startMs = Date.now();
    try {
      const result = await this.executeQuery(userId, analysis.queryConfig);
      await Promise.all([
        datamartRepository.touchAnalysisLastExecuted(analysis.id, startedAt),
        datamartRepository.insertAnalysisRun({
          analysisId: analysis.id,
          userId,
          status: 'SUCCESS',
          executionTimeMs: Date.now() - startMs,
          rowsReturned: result.rows.length,
          errorMessage: null,
        }),
      ]);
      return result;
    } catch (error) {
      await Promise.allSettled([
        datamartRepository.touchAnalysisLastExecuted(analysis.id, startedAt),
        datamartRepository.insertAnalysisRun({
          analysisId: analysis.id,
          userId,
          status: 'FAILED',
          executionTimeMs: Date.now() - startMs,
          rowsReturned: 0,
          errorMessage:
            error instanceof Error ? error.message.slice(0, 1000) : 'The query failed to run',
        }),
      ]);
      throw error;
    }
  },

  async listAnalysisRuns(
    userId: string,
    analysisId: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    await this.getAnalysis(userId, analysisId);
    const runs = await datamartRepository.listRunsByAnalysis(analysisId, userId, options);
    return { items: runs, total: await datamartRepository.countRunsByAnalysis(analysisId, userId) };
  },

  // --- Metrics -------------------------------------------------------------

  async validateMetricDefinition(
    userId: string,
    datasetId: string,
    definition: MetricDefinition,
  ): Promise<void> {
    const schema = await loadSchema(userId, datasetId);

    if (definition.kind === 'aggregate') {
      const column = schema.columns.find((entry) => entry.columnName === definition.column);
      if (!column) {
        throw ApiError.badRequest(
          DATAMART_ERROR_CODES.COLUMN_NOT_FOUND,
          `Column not found: "${definition.column}"`,
        );
      }
      if (
        NUMERIC_AGGREGATIONS.includes(definition.aggregation) &&
        !isNumericCategory(classifyColumnCategory(column.dataType))
      ) {
        throw ApiError.badRequest(
          DATAMART_ERROR_CODES.INVALID_AGGREGATION,
          `"${definition.aggregation}" requires a numeric column; "${definition.column}" is ${column.dataType}`,
        );
      }
      return;
    }

    compileFormula(
      definition.formula,
      formulaContextFromSchema(schema.columns, datasetId),
    );
  },

  async createMetric(
    userId: string,
    input: Omit<CreateMetricInput, 'userId'>,
  ): Promise<DataMartMetric> {
    await requireDataset(userId, input.datasetId);
    await this.validateMetricDefinition(userId, input.datasetId, input.definition);
    return datamartRepository.createMetric({
      userId,
      datasetId: input.datasetId,
      name: input.name,
      description: input.description ?? null,
      definition: input.definition,
      format: input.format,
    });
  },

  async listMetrics(
    userId: string,
    options: { limit?: number; offset?: number; datasetId?: string } = {},
  ) {
    if (options.datasetId) {
      const items = await datamartRepository.listMetricsByDataset(userId, options.datasetId, options.limit);
      return { items, total: items.length };
    }
    const items = await datamartRepository.listMetricsByUser(userId, options);
    return { items, total: await datamartRepository.countMetricsByUser(userId) };
  },

  async getMetric(userId: string, id: string): Promise<DataMartMetric> {
    const metric = await datamartRepository.findMetricByIdAndUser(id, userId);
    if (!metric) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Metric not found',
        undefined,
        'The metric may have been deleted, or the link is invalid.',
      );
    }
    return metric;
  },

  async updateMetric(
    userId: string,
    id: string,
    input: UpdateMetricInput,
  ): Promise<DataMartMetric> {
    const metric = await this.getMetric(userId, id);
    if (input.definition) {
      await this.validateMetricDefinition(userId, metric.datasetId, input.definition);
    }
    const updated = await datamartRepository.updateMetric(metric.id, userId, input);
    if (!updated) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Metric not found',
        undefined,
        'The metric may have been deleted, or the link is invalid.',
      );
    }
    return updated;
  },

  async deleteMetric(userId: string, id: string): Promise<void> {
    await this.getMetric(userId, id);
    await datamartRepository.deleteMetricById(id);
  },

  /** Evaluates a saved metric against its dataset (drives KPI widgets). */
  async executeMetric(
    userId: string,
    id: string,
  ): Promise<{ metric: DataMartMetric; result: DataMartQueryResult }> {
    const metric = await this.getMetric(userId, id);
    await requireDataset(userId, metric.datasetId);

    const query: DataMartQuery = {
      datasets: [metric.datasetId],
      dimensions: [],
      metrics:
        metric.definition.kind === 'aggregate'
          ? [
              {
                column: metric.definition.column,
                aggregation: metric.definition.aggregation,
                alias: 'value',
              },
            ]
          : [{ formula: metric.definition.formula, alias: 'value' }],
      filters: undefined,
      joins: [],
      sort: [],
      limit: 1,
      offset: 0,
    };

    return { metric, result: await this.executeQuery(userId, query) };
  },

  // --- Dashboards ----------------------------------------------------------

  async createDashboard(
    userId: string,
    input: Omit<CreateDashboardInput, 'userId'>,
  ): Promise<DataMartDashboard> {
    return datamartRepository.createDashboard({
      userId,
      name: input.name,
      description: input.description ?? null,
      layout: input.layout,
    });
  },

  async listDashboards(userId: string, options: { limit?: number; offset?: number } = {}) {
    const items = await datamartRepository.listDashboardsByUser(userId, options);
    return { items, total: await datamartRepository.countDashboardsByUser(userId) };
  },

  async getDashboard(userId: string, id: string): Promise<DataMartDashboardDetail> {
    const dashboard = await datamartRepository.findDashboardByIdAndUser(id, userId);
    if (!dashboard) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Dashboard not found',
        undefined,
        'The dashboard may have been deleted, or the link is invalid.',
      );
    }
    const widgets = await datamartRepository.findWidgetsByDashboard(dashboard.id);
    return { ...dashboard, widgets };
  },

  async updateDashboard(
    userId: string,
    id: string,
    input: UpdateDashboardInput,
  ): Promise<DataMartDashboard> {
    await this.getDashboard(userId, id);
    const updated = await datamartRepository.updateDashboard(id, userId, input);
    if (!updated) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Dashboard not found',
        undefined,
        'The dashboard may have been deleted, or the link is invalid.',
      );
    }
    return updated;
  },

  async deleteDashboard(userId: string, id: string): Promise<void> {
    await this.getDashboard(userId, id);
    await datamartRepository.deleteDashboardById(id);
  },

  async createWidget(
    userId: string,
    dashboardId: string,
    input: Omit<CreateWidgetInput, 'dashboardId'>,
  ) {
    await this.getDashboard(userId, dashboardId);
    if (input.analysisId) await this.getAnalysis(userId, input.analysisId);
    if (input.metricId) await this.getMetric(userId, input.metricId);
    return datamartRepository.createWidget({ ...input, dashboardId });
  },

  async updateWidget(
    userId: string,
    dashboardId: string,
    widgetId: string,
    input: UpdateWidgetInput,
  ) {
    const dashboard = await this.getDashboard(userId, dashboardId);
    const owned = dashboard.widgets.some((widget) => widget.id === widgetId);
    if (!owned) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Widget not found',
        undefined,
        'The widget may have been deleted, or the link is invalid.',
      );
    }
    if (input.analysisId !== undefined && input.analysisId) {
      await this.getAnalysis(userId, input.analysisId);
    }
    if (input.metricId !== undefined && input.metricId) {
      await this.getMetric(userId, input.metricId);
    }
    const updated = await datamartRepository.updateWidget(widgetId, userId, input);
    if (!updated) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Widget not found',
        undefined,
        'The widget may have been deleted, or the link is invalid.',
      );
    }
    return updated;
  },

  async deleteWidget(userId: string, dashboardId: string, widgetId: string): Promise<void> {
    const dashboard = await this.getDashboard(userId, dashboardId);
    if (!dashboard.widgets.some((widget) => widget.id === widgetId)) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.NOT_FOUND,
        'Widget not found',
        undefined,
        'The widget may have been deleted, or the link is invalid.',
      );
    }
    await datamartRepository.deleteWidgetById(widgetId);
  },

  async reorderWidgets(userId: string, dashboardId: string, orderedIds: string[]): Promise<void> {
    const dashboard = await this.getDashboard(userId, dashboardId);
    const owned = new Set(dashboard.widgets.map((widget) => widget.id));
    if (orderedIds.length !== dashboard.widgets.length || orderedIds.some((id) => !owned.has(id))) {
      throw ApiError.badRequest(
        DATAMART_ERROR_CODES.INVALID_QUERY,
        'orderedIds must contain exactly the widget ids on this dashboard, in the desired order',
      );
    }
    await datamartRepository.reorderWidgets(dashboardId, orderedIds);
  },

  // --- Overview ------------------------------------------------------------

  async getOverview(userId: string): Promise<DataMartOverview> {
    const raw = await datamartRepository.overviewRaw(userId);
    return {
      datasets: raw.datasetStats,
      analyses: {
        total: raw.analysesTotal,
        recent: raw.recentAnalyses,
      },
      metrics: {
        total: raw.metricsTotal,
        recent: raw.recentMetrics,
      },
      dashboards: {
        total: raw.dashboardsTotal,
      },
      recentDatasets: raw.recentDatasets,
      recentRuns: raw.recentRuns.map((run) => ({
        id: run.id,
        analysisId: run.analysis_id,
        analysisName: run.analysis_name,
        status: run.status,
        executionTimeMs: run.execution_time_ms,
        createdAt: toIso(run.created_at) ?? '',
      })),
    };
  },

  // --- Comparison ----------------------------------------------------------

  async getComparison(userId: string, datasetAId: string, datasetBId: string): Promise<DataMartComparison> {
    if (datasetAId === datasetBId) {
      throw ApiError.badRequest(
        DATAMART_ERROR_CODES.INVALID_QUERY,
        'Compare two different datasets',
      );
    }
    const a = await findDatasetByIdAndUser(datasetAId, userId);
    const b = await findDatasetByIdAndUser(datasetBId, userId);
    if (!a || !b) {
      throw ApiError.notFound(
        DATAMART_ERROR_CODES.DATASET_NOT_FOUND,
        'Dataset not found',
        undefined,
        'Pick two datasets from your library and try again.',
      );
    }
    if (a.status !== 'READY' || !a.storagePath || b.status !== 'READY' || !b.storagePath) {
      throw ApiError.conflict(
        DATAMART_ERROR_CODES.NOT_READY,
        'Both datasets must be ready to compare',
        undefined,
        'Wait for the datasets to finish processing, then try again.',
      );
    }

    const [columnsA, columnsB] = await Promise.all([
      listDatasetColumns(a.id),
      listDatasetColumns(b.id),
    ]);

    const typeOf = new Map<string, string>();
    for (const column of columnsA) typeOf.set(column.columnName, column.dataType);
    for (const column of columnsB) typeOf.set(column.columnName, column.dataType);

    const namesA = new Set(columnsA.map((column) => column.columnName));
    const namesB = new Set(columnsB.map((column) => column.columnName));
    const sharedColumns = [...namesA].filter((name) => namesB.has(name)).sort();
    const allNames = [...new Set([...namesA, ...namesB])].sort();

    const columns = allNames.map((name) => {
      const typeA = typeOf.get(name) ?? null;
      const typeB = typeOf.get(name) ?? null;
      const compatible =
        typeA !== null &&
        typeB !== null &&
        categoriesCompatible(classifyColumnCategory(typeA), classifyColumnCategory(typeB));
      return { name, typeA, typeB, compatible };
    });

    const compatible =
      sharedColumns.length > 0 && columns.every((column) => column.typeA === null || column.typeB === null || column.compatible);

    const pathA = await storageService.acquireLocalPath(a.storagePath);
    const pathB = await storageService.acquireLocalPath(b.storagePath);
    const [profileA, profileB] = await Promise.all([
      profileDataset(pathA, sharedColumns),
      profileDataset(pathB, sharedColumns),
    ]);

    const summary: { metric: string; datasetA: number | null; datasetB: number | null }[] = [
      { metric: 'rows', datasetA: profileA.rows, datasetB: profileB.rows },
    ];
    for (const name of sharedColumns) {
      summary.push({
        metric: `${name} · non-null`,
        datasetA: profileA.byColumn[name]?.nonNull ?? null,
        datasetB: profileB.byColumn[name]?.nonNull ?? null,
      });
    }
    for (const name of sharedColumns) {
      const statsA = profileA.byColumn[name];
      const statsB = profileB.byColumn[name];
      if (!statsA || !statsB) continue;
      const mo = numericStatsLabels(statsA, statsB);
      for (const label of mo.labels) {
        summary.push({
          metric: `${name} · ${label}`,
          datasetA: statsA[label] ?? null,
          datasetB: statsB[label] ?? null,
        });
      }
    }

    return {
      datasets: [
        {
          id: a.id,
          name: a.name,
          rowCount: a.rowCount ?? 0,
          columnCount: a.columnCount ?? 0,
          fileType: a.fileType,
          createdAt: toIso(a.createdAt) ?? '',
        },
        {
          id: b.id,
          name: b.name,
          rowCount: b.rowCount ?? 0,
          columnCount: b.columnCount ?? 0,
          fileType: b.fileType,
          createdAt: toIso(b.createdAt) ?? '',
        },
      ],
      columns,
      compatible,
      summary,
      sharedColumns,
    };
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categoriesCompatible(a: ColumnCategory, b: ColumnCategory): boolean {
  const numeric = new Set<ColumnCategory>(['integer', 'float', 'decimal']);
  const temporal = new Set<ColumnCategory>(['date', 'time', 'datetime']);
  if (numeric.has(a) && numeric.has(b)) return true;
  if (temporal.has(a) && temporal.has(b)) return true;
  return a === b;
}

function numericStatsLabels(
  statsA: ProfileStats,
  statsB: ProfileStats,
): { labels: ('avg' | 'min' | 'max')[] } {
  if (statsA.avg !== null || statsB.avg !== null) return { labels: ['avg', 'min', 'max'] };
  if (statsA.min !== null || statsB.min !== null || statsA.max !== null || statsB.max !== null) {
    return { labels: ['min', 'max'] };
  }
  return { labels: [] };
}

interface ProfileStats {
  nonNull: number;
  avg: number | null;
  min: number | null;
  max: number | null;
}

interface DatasetProfile {
  rows: number;
  byColumn: Record<string, ProfileStats>;
}

/** Single DuckDB pass per dataset computing row count + per-column stats. */
async function profileDataset(
  filePath: string,
  sharedColumns: string[],
): Promise<DatasetProfile> {
  const categories = await probeCategories(filePath, sharedColumns);

  const typed: string[] = ['count(*) AS "__rows"'];
  const numericIndexes: number[] = [];
  sharedColumns.forEach((name, index) => {
    const q = quoteIdent(name);
    const nn = `count(${q}) AS "__nn_${index}"`;
    const category = categories[index];
    if (category && isNumericCategory(category)) {
      numericIndexes.push(index);
      typed.push(nn, `avg(${q}) AS "__avg_${index}"`, `min(${q}) AS "__min_${index}"`, `max(${q}) AS "__max_${index}"`);
    } else if (category && isDateCategory(category)) {
      typed.push(nn, `min(${q}) AS "__min_${index}"`, `max(${q}) AS "__max_${index}"`);
    } else {
      typed.push(nn);
    }
  });

  const rows = await duckdbService.runQuery(
    filePath,
    `SELECT ${typed.join(', ')} FROM ${csvTableRef(filePath)}`,
    [],
  );
  const first = rows[0] ?? {};
  const result: DatasetProfile = { rows: Number(first.__rows ?? 0), byColumn: {} };
  sharedColumns.forEach((name, index) => {
    result.byColumn[name] = {
      nonNull: Number(first[`__nn_${index}`] ?? 0),
      avg: numericIndexes.includes(index) ? toNumberOrNull(first[`__avg_${index}`]) : null,
      min: toNumberOrNull(first[`__min_${index}`]),
      max: toNumberOrNull(first[`__max_${index}`]),
    };
  });
  return result;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** DuckDB type categories for the shared columns (used to choose aggregates). */
async function probeCategories(filePath: string, columns: string[]): Promise<ColumnCategory[]> {
  const categoryByIndex: ColumnCategory[] = [];
  try {
    const describe = await duckdbService.runQuery(filePath, `DESCRIBE SELECT * FROM ${csvTableRef(filePath)}`, []);
    const typeByName = new Map<string, string>();
    for (const row of describe) {
      typeByName.set(String(row.column_name ?? ''), String(row.column_type ?? 'VARCHAR'));
    }
    for (const name of columns) {
      categoryByIndex.push(classifyColumnCategory(typeByName.get(name) ?? 'VARCHAR'));
    }
  } catch {
    for (let index = 0; index < columns.length; index += 1) categoryByIndex.push('string');
  }
  return categoryByIndex;
}

function formulaContextFromSchema(columns: DatasetColumn[], _datasetId: string): FormulaContext {
  const byName = new Map(columns.map((column) => [column.columnName, column]));
  return {
    resolveColumnSql: (name: string): string | null => {
      const column = byName.get(name);
      return column ? quoteIdent(column.columnName) : null;
    },
    isNumericColumn: (name: string): boolean => {
      const column = byName.get(name);
      return column ? isNumericCategory(classifyColumnCategory(column.dataType)) : false;
    },
  };
}