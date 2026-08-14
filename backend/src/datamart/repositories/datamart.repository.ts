import type { PoolClient } from 'pg';
import { pool } from '../../config/database.js';
import type {
  DataMartAnalysis,
  DataMartAnalysisRun,
  DataMartDashboard,
  DataMartDashboardDetail,
  DataMartDashboardWidget,
  DataMartMetric,
  DataMartQuery,
  DataMartWidgetSize,
  DataMartWidgetType,
  MetricDefinition,
  MetricFormat,
} from '../types/index.js';

/** Reusable client/table abstraction: prefer an explicit client for transactions. */
function db(client?: PoolClient): PoolClient | typeof pool {
  return client ?? pool;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toIsoOrThrow(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

// ---------------------------------------------------------------------------
// Analyses
// ---------------------------------------------------------------------------

interface AnalysisRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  query_config: DataMartQuery;
  dataset_ids: string[];
  tags: string[];
  last_executed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

const ANALYSIS_COLUMNS = `
  id, user_id, name, description, query_config, dataset_ids, tags,
  last_executed_at, created_at, updated_at
` as const;

function mapAnalysis(row: AnalysisRow): DataMartAnalysis {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    queryConfig: row.query_config,
    datasetIds: row.dataset_ids,
    tags: row.tags,
    lastExecutedAt: toIso(row.last_executed_at),
    createdAt: toIsoOrThrow(row.created_at),
    updatedAt: toIsoOrThrow(row.updated_at),
  };
}

export interface CreateAnalysisInput {
  userId: string;
  name: string;
  description?: string | null;
  queryConfig: DataMartQuery;
  datasetIds: string[];
  tags: string[];
}

export interface UpdateAnalysisInput {
  name?: string;
  description?: string | null;
  queryConfig?: DataMartQuery;
  datasetIds?: string[];
  tags?: string[];
}

export interface ListOptions {
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

interface RunRow {
  id: string;
  analysis_id: string;
  user_id: string;
  status: 'SUCCESS' | 'FAILED';
  execution_time_ms: number;
  rows_returned: number;
  error_message: string | null;
  created_at: Date;
}

const RUN_COLUMNS = `
  id, analysis_id, user_id, status, execution_time_ms, rows_returned,
  error_message, created_at
` as const;

function mapRun(row: RunRow): DataMartAnalysisRun {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    userId: row.user_id,
    status: row.status,
    executionTimeMs: row.execution_time_ms,
    rowsReturned: row.rows_returned,
    errorMessage: row.error_message,
    createdAt: toIsoOrThrow(row.created_at),
  };
}

export interface RunRowRecent {
  id: string;
  analysis_id: string;
  analysis_name: string;
  user_id: string;
  status: 'SUCCESS' | 'FAILED';
  execution_time_ms: number;
  created_at: Date;
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

interface MetricRow {
  id: string;
  user_id: string;
  dataset_id: string;
  dataset_name: string | null;
  name: string;
  description: string | null;
  definition: MetricDefinition;
  format: MetricFormat;
  created_at: Date;
  updated_at: Date;
}

const METRIC_COLUMNS_WITH_DATASET = `
  m.id, m.user_id, m.dataset_id, d.name AS dataset_name, m.name, m.description,
  m.definition, m.format, m.created_at, m.updated_at
` as const;

const METRIC_JOIN_SQL = `
  SELECT ${METRIC_COLUMNS_WITH_DATASET}
  FROM datamart_metrics m
  LEFT JOIN datasets d ON d.id = m.dataset_id`;

function mapMetric(row: MetricRow): DataMartMetric {
  return {
    id: row.id,
    userId: row.user_id,
    datasetId: row.dataset_id,
    datasetName: row.dataset_name ?? undefined,
    name: row.name,
    description: row.description,
    definition: row.definition,
    format: row.format,
    createdAt: toIsoOrThrow(row.created_at),
    updatedAt: toIsoOrThrow(row.updated_at),
  };
}

export interface CreateMetricInput {
  userId: string;
  datasetId: string;
  name: string;
  description?: string | null;
  definition: MetricDefinition;
  format: MetricFormat;
}

export interface UpdateMetricInput {
  name?: string;
  description?: string | null;
  definition?: MetricDefinition;
  format?: MetricFormat;
}

// ---------------------------------------------------------------------------
// Dashboards
// ---------------------------------------------------------------------------

interface DashboardRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  layout: '1' | '2' | '3';
  created_at: Date;
  updated_at: Date;
}

const DASHBOARD_COLUMNS = `id, user_id, name, description, layout, created_at, updated_at` as const;

function mapDashboard(row: DashboardRow): DataMartDashboard {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    layout: row.layout,
    createdAt: toIsoOrThrow(row.created_at),
    updatedAt: toIsoOrThrow(row.updated_at),
  };
}

export interface CreateDashboardInput {
  userId: string;
  name: string;
  description?: string | null;
  layout: '1' | '2' | '3';
}

export interface UpdateDashboardInput {
  name?: string;
  description?: string | null;
  layout?: '1' | '2' | '3';
}

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

interface WidgetRow {
  id: string;
  dashboard_id: string;
  type: DataMartWidgetType;
  title: string;
  analysis_id: string | null;
  metric_id: string | null;
  configuration: Record<string, unknown>;
  position: number;
  size: DataMartWidgetSize;
  created_at: Date;
}

const WIDGET_COLUMNS = `
  id, dashboard_id, type, title, analysis_id, metric_id, configuration,
  position, size, created_at
` as const;

function mapWidget(row: WidgetRow): DataMartDashboardWidget {
  return {
    id: row.id,
    dashboardId: row.dashboard_id,
    type: row.type,
    title: row.title,
    analysisId: row.analysis_id,
    metricId: row.metric_id,
    configuration: row.configuration,
    position: row.position,
    size: row.size,
    createdAt: toIsoOrThrow(row.created_at),
  };
}

export interface CreateWidgetInput {
  dashboardId: string;
  type: DataMartWidgetType;
  title: string;
  analysisId?: string | null;
  metricId?: string | null;
  configuration: Record<string, unknown>;
  position: number;
  size: DataMartWidgetSize;
}

export interface UpdateWidgetInput {
  type?: DataMartWidgetType;
  title?: string;
  analysisId?: string | null;
  metricId?: string | null;
  configuration?: Record<string, unknown>;
  position?: number;
  size?: DataMartWidgetSize;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

interface CountRow {
  total: number;
}

interface DatasetStats {
  total: number;
  ready: number;
  failed: number;
  totalRows: number;
  totalColumns: number;
  fileTypes: { fileType: string; count: number }[];
}

interface OverviewDatasetRow {
  id: string;
  name: string;
  rowCount: number | null;
  status: string;
  createdAt: string;
}

interface OverviewRaw {
  datasetStats: DatasetStats;
  recentDatasets: OverviewDatasetRow[];
  analysesTotal: number;
  recentAnalyses: DataMartAnalysis[];
  metricsTotal: number;
  recentMetrics: DataMartMetric[];
  dashboardsTotal: number;
  recentRuns: RunRowRecent[];
}

export const datamartRepository = {
  // --- Analyses ------------------------------------------------------------

  async createAnalysis(input: CreateAnalysisInput): Promise<DataMartAnalysis> {
    const result = await pool.query<AnalysisRow>(
      `INSERT INTO datamart_analyses
         (user_id, name, description, query_config, dataset_ids, tags)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)
       RETURNING ${ANALYSIS_COLUMNS}`,
      [
        input.userId,
        input.name,
        input.description ?? null,
        JSON.stringify(input.queryConfig),
        JSON.stringify(input.datasetIds),
        JSON.stringify(input.tags),
      ],
    );
    return mapAnalysis(result.rows[0]!);
  },

  async findAnalysisByIdAndUser(id: string, userId: string): Promise<DataMartAnalysis | null> {
    const result = await pool.query<AnalysisRow>(
      `SELECT ${ANALYSIS_COLUMNS} FROM datamart_analyses WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    const row = result.rows[0];
    return row ? mapAnalysis(row) : null;
  },

  async listAnalysesByUser(userId: string, options: ListOptions = {}): Promise<DataMartAnalysis[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 1000);
    const offset = Math.max(options.offset ?? 0, 0);
    const result = await pool.query<AnalysisRow>(
      `SELECT ${ANALYSIS_COLUMNS}
       FROM datamart_analyses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows.map(mapAnalysis);
  },

  async countAnalysesByUser(userId: string): Promise<number> {
    const result = await pool.query<CountRow>(
      `SELECT count(*)::int AS total FROM datamart_analyses WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0]?.total ?? 0;
  },

  /** Newest-first, capped; used for dashboard/summary previews. */
  async findRecentAnalysesByUser(userId: string, limit = 5): Promise<DataMartAnalysis[]> {
    const result = await pool.query<AnalysisRow>(
      `SELECT ${ANALYSIS_COLUMNS}
       FROM datamart_analyses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, Math.min(Math.max(limit, 1), 20)],
    );
    return result.rows.map(mapAnalysis);
  },

  async updateAnalysis(
    id: string,
    userId: string,
    input: UpdateAnalysisInput,
  ): Promise<DataMartAnalysis | null> {
    const sets: string[] = [];
    const values: unknown[] = [id, userId];
    if (input.name !== undefined) {
      values.push(input.name);
      sets.push(`name = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      sets.push(`description = $${values.length}`);
    }
    if (input.queryConfig !== undefined) {
      values.push(JSON.stringify(input.queryConfig));
      sets.push(`query_config = $${values.length}::jsonb`);
    }
    if (input.datasetIds !== undefined) {
      values.push(JSON.stringify(input.datasetIds));
      sets.push(`dataset_ids = $${values.length}::jsonb`);
    }
    if (input.tags !== undefined) {
      values.push(JSON.stringify(input.tags));
      sets.push(`tags = $${values.length}::jsonb`);
    }
    if (sets.length === 0) {
      return this.findAnalysisByIdAndUser(id, userId);
    }
    const result = await pool.query<AnalysisRow>(
      `UPDATE datamart_analyses SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2
       RETURNING ${ANALYSIS_COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    return row ? mapAnalysis(row) : null;
  },

  async deleteAnalysisById(id: string): Promise<void> {
    await pool.query(`DELETE FROM datamart_analyses WHERE id = $1`, [id]);
  },

  async touchAnalysisLastExecuted(id: string, at: Date): Promise<void> {
    await pool.query(
      `UPDATE datamart_analyses SET last_executed_at = $2 WHERE id = $1`,
      [id, at],
    );
  },

  // --- Runs ----------------------------------------------------------------

  async insertAnalysisRun(input: {
    analysisId: string;
    userId: string;
    status: 'SUCCESS' | 'FAILED';
    executionTimeMs: number;
    rowsReturned: number;
    errorMessage: string | null;
  }): Promise<DataMartAnalysisRun> {
    const result = await pool.query<RunRow>(
      `INSERT INTO datamart_analysis_runs
         (analysis_id, user_id, status, execution_time_ms, rows_returned, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${RUN_COLUMNS}`,
      [
        input.analysisId,
        input.userId,
        input.status,
        input.executionTimeMs,
        input.rowsReturned,
        input.errorMessage,
      ],
    );
    return mapRun(result.rows[0]!);
  },

  async listRunsByAnalysis(
    analysisId: string,
    userId: string,
    options: ListOptions = {},
  ): Promise<DataMartAnalysisRun[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 1000);
    const offset = Math.max(options.offset ?? 0, 0);
    const result = await pool.query<RunRow>(
      `SELECT ${RUN_COLUMNS}
       FROM datamart_analysis_runs
       WHERE analysis_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [analysisId, userId, limit, offset],
    );
    return result.rows.map(mapRun);
  },

  async countRunsByAnalysis(analysisId: string, userId: string): Promise<number> {
    const result = await pool.query<CountRow>(
      `SELECT count(*)::int AS total
       FROM datamart_analysis_runs
       WHERE analysis_id = $1 AND user_id = $2`,
      [analysisId, userId],
    );
    return result.rows[0]?.total ?? 0;
  },

  /** Newest runs (with analysis names) for the overview/activity feed. */
  async findRecentRunsByUser(userId: string, limit = 10): Promise<RunRowRecent[]> {
    const result = await pool.query<RunRowRecent>(
      `SELECT r.id, r.analysis_id, a.name AS analysis_name, r.user_id, r.status,
              r.execution_time_ms, r.created_at
       FROM datamart_analysis_runs r
       JOIN datamart_analyses a ON a.id = r.analysis_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [userId, Math.min(Math.max(limit, 1), 50)],
    );
    return result.rows;
  },

  // --- Metrics -------------------------------------------------------------

  async createMetric(input: CreateMetricInput): Promise<DataMartMetric> {
    const result = await pool.query<MetricRow>(
      `INSERT INTO datamart_metrics
         (user_id, dataset_id, name, description, definition, format)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, user_id, dataset_id, name, description, definition, format,
                 created_at, updated_at,
                 (SELECT d.name FROM datasets d WHERE d.id = dataset_id) AS dataset_name`,
      [
        input.userId,
        input.datasetId,
        input.name,
        input.description ?? null,
        JSON.stringify(input.definition),
        input.format,
      ],
    );
    return mapMetric(result.rows[0]!);
  },

  async findMetricByIdAndUser(id: string, userId: string): Promise<DataMartMetric | null> {
    const result = await pool.query<MetricRow>(
      `${METRIC_JOIN_SQL} WHERE m.id = $1 AND m.user_id = $2`,
      [id, userId],
    );
    const row = result.rows[0];
    return row ? mapMetric(row) : null;
  },

  async listMetricsByUser(userId: string, options: ListOptions = {}): Promise<DataMartMetric[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 1000);
    const offset = Math.max(options.offset ?? 0, 0);
    const result = await pool.query<MetricRow>(
      `${METRIC_JOIN_SQL}
       WHERE m.user_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows.map(mapMetric);
  },

  /** Optional filter by dataset, capped; used for metric pickers. */
  async listMetricsByDataset(userId: string, datasetId: string, limit = 1000): Promise<DataMartMetric[]> {
    const result = await pool.query<MetricRow>(
      `${METRIC_JOIN_SQL}
       WHERE m.user_id = $1 AND m.dataset_id = $2
       ORDER BY m.created_at DESC
       LIMIT $3`,
      [userId, datasetId, Math.min(Math.max(limit, 1), 1000)],
    );
    return result.rows.map(mapMetric);
  },

  async countMetricsByUser(userId: string): Promise<number> {
    const result = await pool.query<CountRow>(
      `SELECT count(*)::int AS total FROM datamart_metrics WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0]?.total ?? 0;
  },

  async findRecentMetricsByUser(userId: string, limit = 5): Promise<DataMartMetric[]> {
    const result = await pool.query<MetricRow>(
      `${METRIC_JOIN_SQL}
       WHERE m.user_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [userId, Math.min(Math.max(limit, 1), 20)],
    );
    return result.rows.map(mapMetric);
  },

  async updateMetric(
    id: string,
    userId: string,
    input: UpdateMetricInput,
  ): Promise<DataMartMetric | null> {
    const sets: string[] = [];
    const values: unknown[] = [id, userId];
    if (input.name !== undefined) {
      values.push(input.name);
      sets.push(`name = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      sets.push(`description = $${values.length}`);
    }
    if (input.definition !== undefined) {
      values.push(JSON.stringify(input.definition));
      sets.push(`definition = $${values.length}::jsonb`);
    }
    if (input.format !== undefined) {
      values.push(input.format);
      sets.push(`format = $${values.length}`);
    }
    if (sets.length === 0) {
      return this.findMetricByIdAndUser(id, userId);
    }
    const result = await pool.query<MetricRow>(
      `UPDATE datamart_metrics SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, dataset_id, name, description, definition, format,
                 created_at, updated_at,
                 (SELECT d.name FROM datasets d WHERE d.id = dataset_id) AS dataset_name`,
      values,
    );
    const row = result.rows[0];
    return row ? mapMetric(row) : null;
  },

  async deleteMetricById(id: string): Promise<void> {
    await pool.query(`DELETE FROM datamart_metrics WHERE id = $1`, [id]);
  },

  // --- Dashboards ----------------------------------------------------------

  async createDashboard(input: CreateDashboardInput): Promise<DataMartDashboard> {
    const result = await pool.query<DashboardRow>(
      `INSERT INTO datamart_dashboards (user_id, name, description, layout)
       VALUES ($1, $2, $3, $4)
       RETURNING ${DASHBOARD_COLUMNS}`,
      [input.userId, input.name, input.description ?? null, input.layout],
    );
    return mapDashboard(result.rows[0]!);
  },

  async findDashboardByIdAndUser(id: string, userId: string): Promise<DataMartDashboard | null> {
    const result = await pool.query<DashboardRow>(
      `SELECT ${DASHBOARD_COLUMNS} FROM datamart_dashboards WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    const row = result.rows[0];
    return row ? mapDashboard(row) : null;
  },

  async listDashboardsByUser(userId: string, options: ListOptions = {}): Promise<DataMartDashboard[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 1000);
    const offset = Math.max(options.offset ?? 0, 0);
    const result = await pool.query<DashboardRow>(
      `SELECT ${DASHBOARD_COLUMNS}
       FROM datamart_dashboards
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows.map(mapDashboard);
  },

  async countDashboardsByUser(userId: string): Promise<number> {
    const result = await pool.query<CountRow>(
      `SELECT count(*)::int AS total FROM datamart_dashboards WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0]?.total ?? 0;
  },

  async updateDashboard(
    id: string,
    userId: string,
    input: UpdateDashboardInput,
  ): Promise<DataMartDashboard | null> {
    const sets: string[] = [];
    const values: unknown[] = [id, userId];
    if (input.name !== undefined) {
      values.push(input.name);
      sets.push(`name = $${values.length}`);
    }
    if (input.description !== undefined) {
      values.push(input.description);
      sets.push(`description = $${values.length}`);
    }
    if (input.layout !== undefined) {
      values.push(input.layout);
      sets.push(`layout = $${values.length}`);
    }
    if (sets.length === 0) {
      return this.findDashboardByIdAndUser(id, userId);
    }
    const result = await pool.query<DashboardRow>(
      `UPDATE datamart_dashboards SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2
       RETURNING ${DASHBOARD_COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    return row ? mapDashboard(row) : null;
  },

  async deleteDashboardById(id: string): Promise<void> {
    await pool.query(`DELETE FROM datamart_dashboards WHERE id = $1`, [id]);
  },

  async findWidgetsByDashboard(dashboardId: string): Promise<DataMartDashboardWidget[]> {
    const result = await pool.query<WidgetRow>(
      `SELECT ${WIDGET_COLUMNS}
       FROM datamart_dashboard_widgets
       WHERE dashboard_id = $1
       ORDER BY position ASC, created_at ASC`,
      [dashboardId],
    );
    return result.rows.map(mapWidget);
  },

  /** Widget lookup scoped by dashboard owner (404 on foreign widgets). */
  async findWidgetByIdAndUser(widgetId: string, userId: string): Promise<DataMartDashboardWidget | null> {
    const result = await pool.query<WidgetRow>(
      `SELECT ${WIDGET_COLUMNS.split(', ').map((column) => `w.${column}`).join(', ')}
       FROM datamart_dashboard_widgets w
       JOIN datamart_dashboards d ON d.id = w.dashboard_id
       WHERE w.id = $1 AND d.user_id = $2`,
      [widgetId, userId],
    );
    const row = result.rows[0];
    return row ? mapWidget(row) : null;
  },

  async createWidget(input: CreateWidgetInput): Promise<DataMartDashboardWidget> {
    const result = await pool.query<WidgetRow>(
      `INSERT INTO datamart_dashboard_widgets
         (dashboard_id, type, title, analysis_id, metric_id, configuration, position, size)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       RETURNING ${WIDGET_COLUMNS}`,
      [
        input.dashboardId,
        input.type,
        input.title,
        input.analysisId ?? null,
        input.metricId ?? null,
        JSON.stringify(input.configuration),
        input.position,
        input.size,
      ],
    );
    return mapWidget(result.rows[0]!);
  },

  async updateWidget(
    widgetId: string,
    userId: string,
    input: UpdateWidgetInput,
  ): Promise<DataMartDashboardWidget | null> {
    const sets: string[] = [];
    const values: unknown[] = [widgetId, userId];
    if (input.type !== undefined) {
      values.push(input.type);
      sets.push(`type = $${values.length}`);
    }
    if (input.title !== undefined) {
      values.push(input.title);
      sets.push(`title = $${values.length}`);
    }
    if (input.analysisId !== undefined) {
      values.push(input.analysisId);
      sets.push(`analysis_id = $${values.length}`);
    }
    if (input.metricId !== undefined) {
      values.push(input.metricId);
      sets.push(`metric_id = $${values.length}`);
    }
    if (input.configuration !== undefined) {
      values.push(JSON.stringify(input.configuration));
      sets.push(`configuration = $${values.length}::jsonb`);
    }
    if (input.position !== undefined) {
      values.push(input.position);
      sets.push(`position = $${values.length}`);
    }
    if (input.size !== undefined) {
      values.push(input.size);
      sets.push(`size = $${values.length}`);
    }
    if (sets.length === 0) {
      return this.findWidgetByIdAndUser(widgetId, userId);
    }
    const result = await pool.query<WidgetRow>(
      `UPDATE datamart_dashboard_widgets w
       SET ${sets.join(', ')}
       FROM datamart_dashboards d
       WHERE w.id = $1 AND w.dashboard_id = d.id AND d.user_id = $2
       RETURNING ${WIDGET_COLUMNS.split(', ').map((column) => `w.${column}`).join(', ')}`,
      values,
    );
    const row = result.rows[0];
    return row ? mapWidget(row) : null;
  },

  async deleteWidgetById(widgetId: string): Promise<void> {
    await pool.query(`DELETE FROM datamart_dashboard_widgets WHERE id = $1`, [widgetId]);
  },

  /**
   * Reorders widgets by updating `position` to the array index of each id.
   * Runs inside a single transaction so a partial failure leaves no gaps.
   */
  async reorderWidgets(dashboardId: string, orderedIds: string[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let index = 0; index < orderedIds.length; index += 1) {
        await client.query(
          `UPDATE datamart_dashboard_widgets
           SET position = $1
           WHERE id = $2 AND dashboard_id = $3`,
          [index, orderedIds[index], dashboardId],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // --- Overview ------------------------------------------------------------

  /** Dataset aggregates for the overview panel. */
  async overviewDatasetStats(userId: string): Promise<DatasetStats> {
    const [counts, fileTypes] = await Promise.all([
      pool.query<{
        total: number;
        ready: number;
        failed: number;
        totalRows: number | null;
        totalColumns: number | null;
      }>(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE status = 'READY')::int AS ready,
                count(*) FILTER (WHERE status = 'FAILED')::int AS failed,
                sum(row_count)::int AS total_rows,
                sum(column_count)::int AS total_columns
         FROM datasets
         WHERE user_id = $1`,
        [userId],
      ),
      pool.query<{ file_type: string; count: number }>(
        `SELECT file_type, count(*)::int AS count
         FROM datasets
         WHERE user_id = $1
         GROUP BY file_type
         ORDER BY count DESC`,
        [userId],
      ),
    ]);
    const row = counts.rows[0] ?? { total: 0, ready: 0, failed: 0, totalRows: null, totalColumns: null };
    return {
      total: row.total,
      ready: row.ready,
      failed: row.failed,
      totalRows: row.totalRows ?? 0,
      totalColumns: row.totalColumns ?? 0,
      fileTypes: fileTypes.rows.map((entry) => ({ fileType: entry.file_type, count: entry.count })),
    };
  },

  /** Newest datasets with the fields the overview card needs. */
  async overviewRecentDatasets(userId: string, limit = 5): Promise<OverviewDatasetRow[]> {
    const result = await pool.query<{
      id: string;
      name: string;
      row_count: number | null;
      status: string;
      created_at: Date;
    }>(
      `SELECT id, name, row_count, status, created_at
       FROM datasets
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, Math.min(Math.max(limit, 1), 20)],
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      rowCount: row.row_count,
      status: row.status,
      createdAt: toIsoOrThrow(row.created_at),
    }));
  },

  /** All overview tables in parallel; the service assembles the response. */
  async overviewRaw(userId: string): Promise<OverviewRaw> {
    const [
      datasetStats,
      recentDatasets,
      analysesTotal,
      recentAnalyses,
      metricsTotal,
      recentMetrics,
      dashboardsTotal,
      recentRuns,
    ] = await Promise.all([
      this.overviewDatasetStats(userId),
      this.overviewRecentDatasets(userId),
      this.countAnalysesByUser(userId),
      this.findRecentAnalysesByUser(userId, 5),
      this.countMetricsByUser(userId),
      this.findRecentMetricsByUser(userId, 5),
      this.countDashboardsByUser(userId),
      this.findRecentRunsByUser(userId, 10),
    ]);
    return {
      datasetStats,
      recentDatasets,
      analysesTotal,
      recentAnalyses,
      metricsTotal,
      recentMetrics,
      dashboardsTotal,
      recentRuns,
    };
  },
};