import type { Dataset, DatasetColumn } from '../models/dataset.model';
import { storageService } from './storage.service';
import { duckdbService, csvTableRef, quoteIdent, type Row } from './duckdb.service';
import { ApiError } from '../utils/httpError';
import { buildFilterWhere, resolveColumn } from '../utils/filterSql';
import {
  classifyColumnCategory,
  isCategoricalCategory,
  isDateCategory,
  isNumericCategory,
  type ColumnCategory,
  type ExplorerRequest,
  type GroupByRequest,
  type ScatterRequest,
  type TimeGranularity,
  type TimeSeriesRequest,
} from '../types/analytics';

/** Maximum numeric columns included in a correlation matrix (pairs are O(k²)). */
const MAX_CORRELATION_COLUMNS = 12;
/** Number of columns scanned per insight family to keep insight generation bounded. */
const INSIGHT_SCAN_LIMIT = 3;
/** Default/maximum rows returned by the data explorer. */
const EXPLORER_DEFAULT_PAGE_SIZE = 50;
const EXPLORER_MAX_PAGE_SIZE = 500;

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const analyticsService = {
  async getOverview(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const { totalRows, duplicateRows, duplicatePercent } = await duplicateAnalysis(filePath);

    const byCategory = new Map<ColumnCategory, number>();
    for (const column of columns) {
      const category = classifyColumnCategory(column.dataType);
      byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    }

    const missingValues = columns.reduce((sum, column) => sum + (column.nullCount ?? 0), 0);
    const totalCells = totalRows * Math.max(columns.length, 1);
    const missingPercent = totalCells > 0 ? (missingValues / totalCells) * 100 : 0;

    return {
      datasetId: dataset.id,
      rowCount: totalRows,
      columnCount: columns.length,
      numericColumns: countCategory(byCategory, isNumericCategory),
      categoricalColumns: countCategory(byCategory, isCategoricalCategory),
      dateColumns: countCategory(byCategory, isDateCategory),
      booleanColumns: byCategory.get('boolean') ?? 0,
      byCategory: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
      missingValues,
      missingPercent,
      duplicateRows,
      duplicatePercent,
    };
  },

  async getQuality(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const { totalRows, duplicateRows, duplicatePercent } = await duplicateAnalysis(filePath);

    const rows = columns.map((column) => {
      const category = classifyColumnCategory(column.dataType);
      const missing = column.nullCount ?? 0;
      const missingPct = totalRows > 0 ? (missing / totalRows) * 100 : 0;
      const unique = column.uniqueCount ?? 0;
      const uniquePct = totalRows > 0 ? (unique / totalRows) * 100 : 0;
      const nonNullPct = 100 - missingPct;
      // Cells in typed (non-string) columns that DuckDB could not parse are
      // recorded as NULL; those are counted as "invalid" values.
      const invalid = category === 'string' || category === 'uuid' ? 0 : missing;

      return {
        column: column.columnName,
        type: column.dataType,
        category,
        missing,
        missingPct,
        unique,
        uniquePct,
        invalid,
        quality: qualityRating(nonNullPct),
      };
    });

    const missingValues = rows.reduce((sum, row) => sum + row.missing, 0);
    const invalidValues = rows.reduce((sum, row) => sum + row.invalid, 0);
    const totalCells = totalRows * Math.max(columns.length, 1);
    const missingPercent = totalCells > 0 ? (missingValues / totalCells) * 100 : 0;
    const invalidPercent = totalCells > 0 ? (invalidValues / totalCells) * 100 : 0;
    // Share of columns that parsed cleanly (no non-conforming cells).
    const typeConsistency =
      rows.length > 0
        ? (rows.filter((row) => row.invalid === 0).length / rows.length) * 100
        : 100;

    const scoreInput = { missingPercent, duplicatePercent, invalidPercent, typeConsistency };

    return {
      datasetId: dataset.id,
      rowCount: totalRows,
      columnCount: columns.length,
      missingValues,
      missingPercent,
      duplicateRows,
      duplicatePercent,
      invalidValues,
      invalidPercent,
      typeConsistency,
      healthScore: computeHealthScore(scoreInput),
      reasons: buildHealthReasons(scoreInput),
      columns: rows,
    };
  },

  async getColumns(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);
    return {
      datasetId: dataset.id,
      total: columns.length,
      columns: columns.map((column) => ({
        name: column.columnName,
        type: column.dataType,
        category: classifyColumnCategory(column.dataType),
        nullable: column.nullable,
      })),
    };
  },

  async getColumnStatistics(dataset: Dataset, columns: DatasetColumn[], columnName: string) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const column = resolveColumn(columns, columnName);
    const category = classifyColumnCategory(column.dataType);
    const q = quoteIdent(column.columnName);
    const ref = csvTableRef(filePath);

    const base = {
      column: column.columnName,
      type: column.dataType,
      category,
    };

    const summaryRow = firstRow(
      await duckdbService.runQuery(
        filePath,
        `SELECT count(*) AS n, count(${q}) AS non_null, count(DISTINCT ${q}) AS distinct_count FROM ${ref}`,
      ),
    );
    const total = toFiniteNumber(summaryRow.n);
    const nonNull = toFiniteNumber(summaryRow.non_null);
    const nullCount = Math.max(total - nonNull, 0);
    const uniqueCount = toFiniteNumber(summaryRow.distinct_count);

    if (isNumericCategory(category)) {
      const statsRow = firstRow(
        await duckdbService.runQuery(
          filePath,
          `SELECT
             min(${q}) AS min_value, max(${q}) AS max_value, avg(${q}) AS mean,
             stddev_pop(${q}) AS stddev,
             quantile_cont(${q}, 0.25) AS p25, quantile_cont(${q}, 0.5) AS p50,
             quantile_cont(${q}, 0.75) AS p75, quantile_cont(${q}, 0.9) AS p90,
             quantile_cont(${q}, 0.95) AS p95, quantile_cont(${q}, 0.99) AS p99
           FROM ${ref}`,
        ),
      );
      const stddev = toFiniteNumber(statsRow.stddev);
      return {
        ...base,
        count: total,
        nullCount,
        nullPercent: percent(nullCount, total),
        uniqueCount,
        uniquePercent: percent(uniqueCount, total),
        numeric: {
          min: toFiniteNumber(statsRow.min_value),
          max: toFiniteNumber(statsRow.max_value),
          mean: toFiniteNumber(statsRow.mean),
          median: toFiniteNumber(statsRow.p50),
          stddev,
          variance: stddev * stddev,
          p25: toFiniteNumber(statsRow.p25),
          p50: toFiniteNumber(statsRow.p50),
          p75: toFiniteNumber(statsRow.p75),
          p90: toFiniteNumber(statsRow.p90),
          p95: toFiniteNumber(statsRow.p95),
          p99: toFiniteNumber(statsRow.p99),
        },
      };
    }

    if (category === 'boolean') {
      const boolRow = firstRow(
        await duckdbService.runQuery(
          filePath,
          `SELECT count(*) FILTER (WHERE ${q} = true) AS true_count,
                  count(*) FILTER (WHERE ${q} = false) AS false_count
           FROM ${ref}`,
        ),
      );
      return {
        ...base,
        count: total,
        nullCount,
        nullPercent: percent(nullCount, total),
        uniqueCount: uniqueCount,
        uniquePercent: percent(uniqueCount, total),
        boolean: {
          trueCount: toFiniteNumber(boolRow.true_count),
          falseCount: toFiniteNumber(boolRow.false_count),
        },
      };
    }

    if (isDateCategory(category)) {
      const dateRow = firstRow(
        await duckdbService.runQuery(
          filePath,
          `SELECT min(${q}) AS min_value, max(${q}) AS max_value FROM ${ref}`,
        ),
      );
      const minValue = dateRow.min_value as string | Date | null | undefined;
      const maxValue = dateRow.max_value as string | Date | null | undefined;
      const rangeDays = computeDateRangeDays(minValue, maxValue);
      return {
        ...base,
        count: total,
        nullCount,
        nullPercent: percent(nullCount, total),
        uniqueCount: uniqueCount,
        uniquePercent: percent(uniqueCount, total),
        date: {
          min: minValue ? new Date(String(minValue)).toISOString() : null,
          max: maxValue ? new Date(String(maxValue)).toISOString() : null,
          rangeDays,
        },
      };
    }

    // Categorical: unique count + top values.
    const topValues = await this.topValuesForColumn(filePath, column.columnName, 10, total);
    return {
      ...base,
      count: total,
      nullCount,
      nullPercent: percent(nullCount, total),
      uniqueCount: uniqueCount,
      uniquePercent: percent(uniqueCount, total),
      categorical: {
        distinctCount: uniqueCount,
        topValues,
      },
    };
  },

  async getColumnDistribution(
    dataset: Dataset,
    columns: DatasetColumn[],
    columnName: string,
    bucketCount = 30,
  ) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const column = resolveColumn(columns, columnName);
    const category = classifyColumnCategory(column.dataType);

    if (!isNumericCategory(category)) {
      const topValues = await this.topValuesForColumn(filePath, column.columnName, 20, 0);
      return {
        kind: 'categorical',
        column: column.columnName,
        type: column.dataType,
        category,
        topValues,
      };
    }

    const q = quoteIdent(column.columnName);
    const ref = csvTableRef(filePath);
    const bounds = firstRow(
      await duckdbService.runQuery(
        filePath,
        `SELECT min(${q}) AS mn, max(${q}) AS mx, count(${q}) AS non_null FROM ${ref}`,
      ),
    );
    const mn = toFiniteNumber(bounds.mn);
    const mx = toFiniteNumber(bounds.mx);
    const nonNull = toFiniteNumber(bounds.non_null);

    const buckets = clampInt(bucketCount, 5, 200);
    let histogram: { min: number; max: number; count: number }[];

    if (nonNull === 0) {
      histogram = [];
    } else if (mn === mx) {
      histogram = [{ min: mn, max: mx, count: nonNull }];
    } else {
      const bucketRows = await duckdbService.runQuery(
        filePath,
        `WITH __bounds AS (SELECT ? AS mn, ? AS mx),
              __b AS (
                SELECT CASE WHEN __bounds.mx = __bounds.mn THEN 0
                       ELSE LEAST(${buckets - 1}, CAST(floor((${q} - __bounds.mn) / (__bounds.mx - __bounds.mn) * ${buckets}) AS BIGINT))
                       END AS __bkt
                FROM ${ref}, __bounds
                WHERE ${q} IS NOT NULL
              )
         SELECT __bkt AS bkt, count(*) AS count FROM __b GROUP BY __bkt ORDER BY __bkt`,
        [mn, mx],
      );
      const counts = new Map<number, number>();
      for (const row of bucketRows) {
        counts.set(toFiniteNumber(row.bkt), toFiniteNumber(row.count));
      }
      const width = (mx - mn) / buckets;
      histogram = [];
      for (let i = 0; i < buckets; i += 1) {
        const bucketMin = mn + i * width;
        const bucketMax = i === buckets - 1 ? mx : mn + (i + 1) * width;
        histogram.push({
          min: bucketMin,
          max: bucketMax,
          count: counts.get(i) ?? 0,
        });
      }
    }

    return {
      kind: 'histogram',
      column: column.columnName,
      type: column.dataType,
      category,
      buckets: histogram,
      stats: { min: mn, max: mx, nonNull },
    };
  },

  async getColumnTopValues(
    dataset: Dataset,
    columns: DatasetColumn[],
    columnName: string,
    top = 10,
  ) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const column = resolveColumn(columns, columnName);
    const category = classifyColumnCategory(column.dataType);

    const summaryRow = firstRow(
      await duckdbService.runQuery(
        filePath,
        `SELECT count(${quoteIdent(column.columnName)}) AS n FROM ${csvTableRef(filePath)}`,
      ),
    );
    const total = toFiniteNumber(summaryRow.n);
    const topValues = await this.topValuesForColumn(filePath, column.columnName, top, total);

    return {
      column: column.columnName,
      type: column.dataType,
      category,
      total,
      topValues,
    };
  },

  async getColumnOutliers(dataset: Dataset, columns: DatasetColumn[], columnName: string) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const column = resolveColumn(columns, columnName);
    const category = classifyColumnCategory(column.dataType);
    if (!isNumericCategory(category)) {
      throw ApiError.badRequest(
        'COLUMN_NOT_NUMERIC',
        `Outlier analysis requires a numeric column: "${column.columnName}" is ${column.dataType}`,
      );
    }

    const q = quoteIdent(column.columnName);
    const ref = csvTableRef(filePath);
    const quartiles = firstRow(
      await duckdbService.runQuery(
        filePath,
        `SELECT quantile_cont(${q}, 0.25) AS q1, quantile_cont(${q}, 0.75) AS q3 FROM ${ref}`,
      ),
    );
    const q1 = toFiniteNumber(quartiles.q1);
    const q3 = toFiniteNumber(quartiles.q3);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const countRow = firstRow(
      await duckdbService.runQuery(
        filePath,
        `SELECT count(*) AS n FROM ${ref} WHERE ${q} < ? OR ${q} > ?`,
        [lowerBound, upperBound],
      ),
    );
    const totalRow = firstRow(
      await duckdbService.runQuery(filePath, `SELECT count(*) AS n FROM ${ref}`),
    );
    const outlierCount = toFiniteNumber(countRow.n);
    const total = toFiniteNumber(totalRow.n);

    return {
      column: column.columnName,
      method: 'IQR',
      q1,
      q3,
      iqr,
      lowerBound,
      upperBound,
      outlierCount,
      outlierPercent: percent(outlierCount, total),
      totalRows: total,
    };
  },

  async getCorrelation(dataset: Dataset, columns: DatasetColumn[], requestedColumns?: string[]) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);

    const numeric = columns.filter((column) =>
      isNumericCategory(classifyColumnCategory(column.dataType)),
    );

    let selected = numeric;
    if (requestedColumns?.length) {
      const wanted = new Set(requestedColumns);
      selected = numeric.filter((column) => wanted.has(column.columnName));
    }
    selected = selected.slice(0, MAX_CORRELATION_COLUMNS);

    const names = selected.map((column) => column.columnName);
    if (selected.length < 2) {
      return {
        columns: names,
        pairs: [],
        matrix: names.map((name) => [{ columnA: name, columnB: name, correlation: 1 }]),
        truncated: numeric.length > selected.length,
      };
    }

    const ref = csvTableRef(filePath);
    const exprs: string[] = [];
    for (let i = 0; i < selected.length; i += 1) {
      for (let j = i + 1; j < selected.length; j += 1) {
        exprs.push(
          `corr(${quoteIdent(selected[i]!.columnName)}, ${quoteIdent(selected[j]!.columnName)}) AS "__c${i}_${j}"`,
        );
      }
    }

    const row = firstRow(await duckdbService.runQuery(filePath, `SELECT ${exprs.join(', ')} FROM ${ref}`));

    const pairs: { columnA: string; columnB: string; correlation: number | null }[] = [];
    for (let i = 0; i < selected.length; i += 1) {
      for (let j = i + 1; j < selected.length; j += 1) {
        const r = row[`__c${i}_${j}`];
        pairs.push({
          columnA: selected[i]!.columnName,
          columnB: selected[j]!.columnName,
          correlation: r === null || r === undefined ? null : toFiniteNumber(r),
        });
      }
    }

    const correlationOf = (a: number, b: number): number | null => {
      if (a === b) return 1;
      const pair = pairs.find(
        (p) =>
          (p.columnA === names[a] && p.columnB === names[b]) ||
          (p.columnA === names[b] && p.columnB === names[a]),
      );
      return pair?.correlation ?? null;
    };

    const matrix = names.map((_, a) => names.map((_, b) => correlationOf(a, b)));

    return { columns: names, pairs, matrix, truncated: numeric.length > selected.length };
  },

  async getGroupBy(dataset: Dataset, columns: DatasetColumn[], input: GroupByRequest) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const groupColumn = resolveColumn(columns, input.groupBy);
    const aggregation = input.aggregation;

    let aggExpr: string;
    if (aggregation === 'count') {
      aggExpr = input.metric ? `count(${quoteIdent(input.metric)})` : 'count(*)';
      if (input.metric) resolveColumn(columns, input.metric);
    } else {
      if (!input.metric) {
        throw ApiError.badRequest(
          'METRIC_REQUIRED',
          `"${aggregation}" aggregation requires a numeric metric column`,
        );
      }
      const metricColumn = resolveColumn(columns, input.metric);
      if (!isNumericCategory(classifyColumnCategory(metricColumn.dataType))) {
        throw ApiError.badRequest(
          'INVALID_METRIC',
          `"${metricColumn.columnName}" is not a numeric column`,
        );
      }
      aggExpr = `${aggregation}(${quoteIdent(metricColumn.columnName)})`;
    }

    const topN = clampInt(input.topN ?? 10, 1, 100);
    const q = quoteIdent(groupColumn.columnName);
    const ref = csvTableRef(filePath);

    const rows = await duckdbService.runQuery(
      filePath,
      `SELECT ${q} AS __key, ${aggExpr} AS value
       FROM ${ref}
       WHERE ${q} IS NOT NULL
       GROUP BY ${q}
       ORDER BY value DESC, __key ASC
       LIMIT ${topN}`,
    );

    return {
      groupBy: groupColumn.columnName,
      aggregation,
      metric: input.metric ?? null,
      topN,
      rows: rows.map((row) => ({ key: row.__key, value: toFiniteNumber(row.value) })),
    };
  },

  async getScatter(dataset: Dataset, columns: DatasetColumn[], input: ScatterRequest) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const xColumn = resolveColumn(columns, input.x);
    const yColumn = resolveColumn(columns, input.y);

    if (!isNumericCategory(classifyColumnCategory(xColumn.dataType))) {
      throw ApiError.badRequest('INVALID_AXIS', `Scatter X axis must be numeric: "${xColumn.columnName}" is ${xColumn.dataType}`);
    }
    if (!isNumericCategory(classifyColumnCategory(yColumn.dataType))) {
      throw ApiError.badRequest('INVALID_AXIS', `Scatter Y axis must be numeric: "${yColumn.columnName}" is ${yColumn.dataType}`);
    }

    const sample = clampInt(input.sample ?? 2000, 1, 5000);
    const ref = csvTableRef(filePath);
    const xq = quoteIdent(xColumn.columnName);
    const yq = quoteIdent(yColumn.columnName);

    const totalRow = firstRow(
      await duckdbService.runQuery(
        filePath,
        `SELECT count(*) AS n FROM ${ref} WHERE ${xq} IS NOT NULL AND ${yq} IS NOT NULL`,
      ),
    );
    const total = toFiniteNumber(totalRow.n);

    const rows = await duckdbService.runQuery(
      filePath,
      `SELECT ${xq} AS x, ${yq} AS y
       FROM (SELECT * FROM ${ref} USING SAMPLE reservoir(${sample}))
       WHERE ${xq} IS NOT NULL AND ${yq} IS NOT NULL
       LIMIT ${sample}`,
    );

    return {
      x: xColumn.columnName,
      y: yColumn.columnName,
      total,
      sampled: rows.length,
      sampledRatio: total > 0 ? rows.length / total : 0,
      points: rows.map((row) => ({ x: toFiniteNumber(row.x), y: toFiniteNumber(row.y) })),
    };
  },

  async getTimeSeries(dataset: Dataset, columns: DatasetColumn[], input: TimeSeriesRequest) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const dateColumn = resolveColumn(columns, input.dateColumn);
    const category = classifyColumnCategory(dateColumn.dataType);
    if (!isDateCategory(category)) {
      throw ApiError.badRequest(
        'COLUMN_NOT_DATE',
        `Time-series analysis requires a date column: "${dateColumn.columnName}" is ${dateColumn.dataType}`,
      );
    }

    let aggExpr: string;
    if (input.aggregation === 'count') {
      aggExpr = input.metric ? `count(${quoteIdent(input.metric)})` : 'count(*)';
      if (input.metric) resolveColumn(columns, input.metric);
    } else {
      if (!input.metric) {
        throw ApiError.badRequest(
          'METRIC_REQUIRED',
          `"${input.aggregation}" aggregation requires a numeric metric column`,
        );
      }
      const metricColumn = resolveColumn(columns, input.metric);
      if (!isNumericCategory(classifyColumnCategory(metricColumn.dataType))) {
        throw ApiError.badRequest(
          'INVALID_METRIC',
          `"${metricColumn.columnName}" is not a numeric column`,
        );
      }
      aggExpr = `${input.aggregation}(${quoteIdent(metricColumn.columnName)})`;
    }

    const granularity = input.granularity;
    const q = quoteIdent(dateColumn.columnName);
    const ref = csvTableRef(filePath);

    const rows = await duckdbService.runQuery(
      filePath,
      `SELECT date_trunc('${granularity}', CAST(${q} AS TIMESTAMP)) AS __period, ${aggExpr} AS value
       FROM ${ref}
       WHERE ${q} IS NOT NULL
       GROUP BY __period
       ORDER BY __period`,
    );

    const points = rows.map((row) => {
      const period = row.__period;
      const date = period instanceof Date ? period : new Date(String(period ?? ''));
      return {
        period: date.toISOString(),
        label: formatPeriodLabel(date, granularity),
        value: toFiniteNumber(row.value),
      };
    });

    return {
      dateColumn: dateColumn.columnName,
      granularity,
      aggregation: input.aggregation,
      metric: input.metric ?? null,
      points,
    };
  },

  async getFilteredRows(dataset: Dataset, columns: DatasetColumn[], request: ExplorerRequest) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);

    const page = clampInt(request.page ?? 1, 1, 1_000_000);
    const pageSize = clampInt(request.pageSize ?? EXPLORER_DEFAULT_PAGE_SIZE, 1, EXPLORER_MAX_PAGE_SIZE);

    let selectColumns = columns;
    if (request.columns?.length) {
      const wanted = new Set(request.columns);
      selectColumns = columns.filter((column) => wanted.has(column.columnName));
    }
    if (selectColumns.length === 0) {
      throw ApiError.badRequest('COLUMN_NOT_FOUND', 'None of the requested columns exist');
    }

    const filterSql = buildFilterWhere(request.filters, columns);
    const searchSql = buildSearchWhere(request.search, columns);
    const whereParts = [filterSql.clause, searchSql.clause].filter((clause) => clause !== '');
    const whereSql = whereParts.length > 0 ? ` WHERE ${whereParts.join(' AND ')}` : '';
    const params = [...filterSql.params, ...searchSql.params];

    const totalRow = firstRow(
      await duckdbService.runQuery(
        filePath,
        `SELECT count(*) AS n FROM ${csvTableRef(filePath)}${whereSql}`,
        params,
      ),
    );
    const total = toFiniteNumber(totalRow.n);

    let orderSql = '';
    if (request.sort) {
      const sortColumn = resolveColumn(columns, request.sort.column);
      orderSql = ` ORDER BY ${quoteIdent(sortColumn.columnName)} ${request.sort.direction === 'desc' ? 'DESC' : 'ASC'}`;
    }

    const selectList = selectColumns.map((column) => quoteIdent(column.columnName)).join(', ');
    const offset = (page - 1) * pageSize;
    const rows = await duckdbService.runQuery(
      filePath,
      `SELECT ${selectList} FROM ${csvTableRef(filePath)}${whereSql}${orderSql} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return {
      columns: selectColumns.map((column) => ({
        name: column.columnName,
        type: column.dataType,
        category: classifyColumnCategory(column.dataType),
      })),
      rows,
      total,
      page,
      pageSize,
      truncated: total > page * pageSize,
    };
  },

  async getInsights(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);

    const insights: Insight[] = [];

    // --- Data quality (reuses stored metadata + one duplicate scan) ---
    const quality = await this.getQuality(dataset, columns);
    if (quality.missingPercent > 0) {
      insights.push({
        type: 'DATA_QUALITY',
        severity: quality.missingPercent >= 5 ? 'WARNING' : 'INFO',
        title: 'Missing values detected',
        description: `${formatPercent(quality.missingPercent)} of cells are empty or missing.`,
        metadata: { missingValues: quality.missingValues, missingPercent: quality.missingPercent },
      });
    }
    if (quality.duplicatePercent > 0) {
      insights.push({
        type: 'DATA_QUALITY',
        severity: quality.duplicatePercent >= 2 ? 'WARNING' : 'INFO',
        title: 'Duplicate rows detected',
        description: `${formatNumber(quality.duplicateRows)} rows (${formatPercent(quality.duplicatePercent)}) are exact duplicates.`,
        metadata: { duplicateRows: quality.duplicateRows, duplicatePercent: quality.duplicatePercent },
      });
    }
    if (quality.invalidPercent > 0) {
      insights.push({
        type: 'DATA_QUALITY',
        severity: quality.invalidPercent >= 2 ? 'WARNING' : 'INFO',
        title: 'Non-conforming values detected',
        description: `${formatNumber(quality.invalidValues)} values (${formatPercent(quality.invalidPercent)}) could not be parsed into their column type.`,
        metadata: { invalidValues: quality.invalidValues, invalidPercent: quality.invalidPercent },
      });
    }
    if (insights.length === 0) {
      insights.push({
        type: 'DATA_QUALITY',
        severity: 'GOOD',
        title: 'Clean dataset',
        description: 'No missing, duplicate or non-conforming values were detected.',
        metadata: {},
      });
    }

    // --- Categorical dominance (bounded scan) ---
    const categoricalColumns = columns
      .filter((column) => isCategoricalCategory(classifyColumnCategory(column.dataType)))
      .slice(0, INSIGHT_SCAN_LIMIT);
    for (const column of categoricalColumns) {
      const top = await this.getColumnTopValues(dataset, columns, column.columnName, 1);
      const first = top.topValues[0];
      if (first && top.total > 0) {
        insights.push({
          type: 'CATEGORY',
          severity: 'INFO',
          title: `"${displayValue(first.value)}" dominates ${column.columnName}`,
          description: `"${displayValue(first.value)}" accounts for ${formatPercent(first.percent)} of non-null values in ${column.columnName}.`,
          metadata: { column: column.columnName, value: first.value, percent: first.percent },
        });
      }
    }

    // --- Distribution shape (bounded scan) ---
    const numericColumns = columns
      .filter((column) => isNumericCategory(classifyColumnCategory(column.dataType)))
      .slice(0, INSIGHT_SCAN_LIMIT);
    for (const column of numericColumns) {
      const stats = await this.getColumnStatistics(dataset, columns, column.columnName);
      if ('numeric' in stats) {
        const { mean, median, stddev } = stats.numeric;
        const spread = stddev > 0 ? (Math.abs(mean - median) / stddev) : 0;
        let shape = 'roughly symmetric';
        if (spread > 0.15) shape = mean > median ? 'right-skewed' : 'left-skewed';
        insights.push({
          type: 'DISTRIBUTION',
          severity: 'INFO',
          title: `${column.columnName} distribution is ${shape}`,
          description: `Mean ${formatNumber(mean)} vs median ${formatNumber(median)} (std dev ${formatNumber(stddev)}).`,
          metadata: { column: column.columnName, mean, median, stddev },
        });
      }
    }

    // --- Strongest correlation ---
    const correlation = await this.getCorrelation(dataset, columns);
    let strongest: { columnA: string; columnB: string; correlation: number | null } | undefined;
    for (const pair of correlation.pairs) {
      if (pair.correlation === null) continue;
      if (!strongest || Math.abs(pair.correlation) > Math.abs(strongest.correlation!)) {
        strongest = pair;
      }
    }
    if (strongest?.correlation) {
      insights.push({
        type: 'CORRELATION',
        severity: 'INFO',
        title: `${strongest.columnA} and ${strongest.columnB} are ${describeCorrelation(strongest.correlation)}`,
        description: `Pearson correlation of ${strongest.correlation.toFixed(3)} between ${strongest.columnA} and ${strongest.columnB}.`,
        metadata: strongest,
      });
    }

    // --- Outliers (worst numeric column) ---
    for (const column of numericColumns) {
      const outliers = await this.getColumnOutliers(dataset, columns, column.columnName);
      if (outliers.outlierPercent >= 0.5) {
        insights.push({
          type: 'OUTLIER',
          severity: outliers.outlierPercent >= 2 ? 'WARNING' : 'INFO',
          title: `Potential outliers in ${column.columnName}`,
          description: `${formatNumber(outliers.outlierCount)} values (${formatPercent(outliers.outlierPercent)}) fall outside the IQR fence (${formatNumber(outliers.lowerBound)} … ${formatNumber(outliers.upperBound)}).`,
          metadata: { ...outliers, column: column.columnName },
        });
        break;
      }
    }

    // --- Time trend ---
    const dateColumn = columns.find((column) =>
      isDateCategory(classifyColumnCategory(column.dataType)),
    );
    if (dateColumn) {
      const metric = numericColumns[0]?.columnName;
      const series = await this.getTimeSeries(dataset, columns, {
        dateColumn: dateColumn.columnName,
        metric,
        aggregation: metric ? 'sum' : 'count',
        granularity: 'month',
      });
      if (series.points.length >= 2) {
        const first = series.points[0]!;
        const last = series.points[series.points.length - 1]!;
        if (last.value > 0) {
          const changePct = ((last.value - first.value) / last.value) * 100;
          insights.push({
            type: 'TREND',
            severity: Math.abs(changePct) >= 10 ? 'INFO' : 'LOW',
            title: `${metric ?? 'Record volume'} ${changePct >= 0 ? 'increased' : 'decreased'} over the period`,
            description: `${formatNumber(first.value)} (${first.label}) → ${formatNumber(last.value)} (${last.label}), a ${formatPercent(Math.abs(changePct))} ${changePct >= 0 ? 'increase' : 'decrease'}.`,
            metadata: { from: first, to: last, changePct },
          });
        }
      }
    }

    return { insights };
  },

  // --- Extended Analytics for Analysis Dashboard ---

  async getFullStatistics(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const results = [];

    for (const column of columns) {
      const category = classifyColumnCategory(column.dataType);
      const q = quoteIdent(column.columnName);
      const ref = csvTableRef(filePath);

      const summaryRow = firstRow(
        await duckdbService.runQuery(
          filePath,
          `SELECT count(*) AS n, count(${q}) AS non_null, count(DISTINCT ${q}) AS distinct_count FROM ${ref}`,
        ),
      );
      const total = toFiniteNumber(summaryRow.n);
      const nonNull = toFiniteNumber(summaryRow.non_null);
      const nullCount = Math.max(total - nonNull, 0);
      const uniqueCount = toFiniteNumber(summaryRow.distinct_count);

      const base = {
        column: column.columnName,
        type: column.dataType,
        category,
        count: total,
        nullCount,
        nullPercent: percent(nullCount, total),
        uniqueCount,
        uniquePercent: percent(uniqueCount, total),
      };

      if (isNumericCategory(category)) {
        const statsRow = firstRow(
          await duckdbService.runQuery(
            filePath,
            `SELECT
               min(${q}) AS min_value, max(${q}) AS max_value, avg(${q}) AS mean,
               stddev_pop(${q}) AS stddev, variance_pop(${q}) AS variance,
               quantile_cont(${q}, 0.1) AS p10, quantile_cont(${q}, 0.25) AS p25,
               quantile_cont(${q}, 0.5) AS p50, quantile_cont(${q}, 0.75) AS p75,
               quantile_cont(${q}, 0.9) AS p90, quantile_cont(${q}, 0.95) AS p95,
               quantile_cont(${q}, 0.99) AS p99,
               -- Skewness using Pearson's formula
               CASE WHEN stddev_pop(${q}) > 0 THEN
                 avg(POW(${q} - avg(${q}), 3)) / POW(stddev_pop(${q}), 3)
               ELSE 0 END AS skewness,
               -- Kurtosis (excess)
               CASE WHEN stddev_pop(${q}) > 0 THEN
                 avg(POW(${q} - avg(${q}), 4)) / POW(stddev_pop(${q}), 4) - 3
               ELSE 0 END AS kurtosis
             FROM ${ref}`,
          ),
        );
        const stddev = toFiniteNumber(statsRow.stddev);
        const minVal = toFiniteNumber(statsRow.min_value);
        const maxVal = toFiniteNumber(statsRow.max_value);
        const q1 = toFiniteNumber(statsRow.p25);
        const q3 = toFiniteNumber(statsRow.p75);

        // Mode calculation
        const modeRow = firstRow(
          await duckdbService.runQuery(
            filePath,
            `SELECT ${q} AS mode_val FROM ${ref}
             WHERE ${q} IS NOT NULL
             GROUP BY ${q} ORDER BY count(*) DESC, ${q} ASC LIMIT 1`,
          ),
        );

        results.push({
          ...base,
          numeric: {
            min: minVal,
            max: maxVal,
            mean: toFiniteNumber(statsRow.mean),
            median: toFiniteNumber(statsRow.p50),
            mode: toFiniteNumber(modeRow.mode_val),
            stddev,
            variance: toFiniteNumber(statsRow.variance),
            skewness: toFiniteNumber(statsRow.skewness),
            kurtosis: toFiniteNumber(statsRow.kurtosis),
            range: maxVal - minVal,
            iqr: q3 - q1,
            q1,
            q3,
            p10: toFiniteNumber(statsRow.p10),
            p25: toFiniteNumber(statsRow.p25),
            p50: toFiniteNumber(statsRow.p50),
            p75: toFiniteNumber(statsRow.p75),
            p90: toFiniteNumber(statsRow.p90),
            p95: toFiniteNumber(statsRow.p95),
            p99: toFiniteNumber(statsRow.p99),
          },
        });
      } else if (category === 'boolean') {
        const boolRow = firstRow(
          await duckdbService.runQuery(
            filePath,
            `SELECT count(*) FILTER (WHERE ${q} = true) AS true_count,
                    count(*) FILTER (WHERE ${q} = false) AS false_count
             FROM ${ref}`,
          ),
        );
        results.push({
          ...base,
          boolean: {
            trueCount: toFiniteNumber(boolRow.true_count),
            falseCount: toFiniteNumber(boolRow.false_count),
          },
        });
      } else if (isDateCategory(category)) {
        const dateRow = firstRow(
          await duckdbService.runQuery(
            filePath,
            `SELECT min(${q}) AS min_value, max(${q}) AS max_value FROM ${ref}`,
          ),
        );
        const minValue = dateRow.min_value as string | Date | null | undefined;
        const maxValue = dateRow.max_value as string | Date | null | undefined;
        results.push({
          ...base,
          date: {
            min: minValue ? new Date(String(minValue)).toISOString() : null,
            max: maxValue ? new Date(String(maxValue)).toISOString() : null,
            rangeDays: computeDateRangeDays(minValue, maxValue),
          },
        });
      } else {
        // Categorical
        const topValues = await this.topValuesForColumn(filePath, column.columnName, 10, total);
        const rareThreshold = total * 0.01;
        const rareValues = topValues.filter((v) => v.count <= rareThreshold);
        results.push({
          ...base,
          categorical: {
            distinctCount: uniqueCount,
            topValues,
            rareCategories: rareValues,
            cardinality: uniqueCount,
          },
        });
      }
    }

    return { statistics: results };
  },

  async getMissingValueAnalysis(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const ref = csvTableRef(filePath);

    const totalRow = firstRow(
      await duckdbService.runQuery(filePath, `SELECT count(*) AS n FROM ${ref}`),
    );
    const totalRows = toFiniteNumber(totalRow.n);

    const columnAnalysis = columns.map((column) => {
      const missing = column.nullCount ?? 0;
      const missingPercent = totalRows > 0 ? (missing / totalRows) * 100 : 0;
      return {
        column: column.columnName,
        missing,
        missingPercent,
        rank: 0,
      };
    });

    // Sort by missing count descending and assign ranks
    columnAnalysis.sort((a, b) => b.missing - a.missing);
    columnAnalysis.forEach((col, idx) => {
      col.rank = idx + 1;
    });

    const totalCells = totalRows * Math.max(columns.length, 1);
    const totalMissing = columnAnalysis.reduce((sum, col) => sum + col.missing, 0);

    // Generate recommendations
    const recommendations = columnAnalysis
      .filter((col) => col.missing > 0)
      .map((col) => {
        let action = 'Keep as is';
        let reason = 'Minimal missing values';

        if (col.missingPercent > 50) {
          action = 'Consider removing column';
          reason = `More than 50% missing (${col.missingPercent.toFixed(1)}%)`;
        } else if (col.missingPercent > 20) {
          action = 'Investigate missing pattern';
          reason = `${col.missingPercent.toFixed(1)}% missing - may indicate data collection issues`;
        } else if (col.missingPercent > 5) {
          action = 'Fill with median or mode';
          reason = `${col.missingPercent.toFixed(1)}% missing - imputation recommended`;
        } else {
          action = 'Fill with mean/median or remove rows';
          reason = `Only ${col.missingPercent.toFixed(1)}% missing - minimal impact`;
        }

        return { column: col.column, action, reason };
      });

    return {
      totalCells,
      totalMissing,
      totalMissingPercent: totalCells > 0 ? (totalMissing / totalCells) * 100 : 0,
      columns: columnAnalysis,
      recommendations,
    };
  },

  async getOutlierAnalysis(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const numericColumns = columns.filter((col) =>
      isNumericCategory(classifyColumnCategory(col.dataType)),
    );

    const results = [];
    for (const column of numericColumns) {
      const q = quoteIdent(column.columnName);
      const ref = csvTableRef(filePath);

      const quartiles = firstRow(
        await duckdbService.runQuery(
          filePath,
          `SELECT quantile_cont(${q}, 0.25) AS q1, quantile_cont(${q}, 0.75) AS q3,
                  avg(${q}) AS mean_val, stddev_pop(${q}) AS stddev_val
           FROM ${ref}`,
        ),
      );
      const q1 = toFiniteNumber(quartiles.q1);
      const q3 = toFiniteNumber(quartiles.q3);
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      // IQR outliers
      const iqrCountRow = firstRow(
        await duckdbService.runQuery(
          filePath,
          `SELECT count(*) AS n FROM ${ref} WHERE ${q} < ? OR ${q} > ?`,
          [lowerBound, upperBound],
        ),
      );

      // Z-score outliers (|z| > 3)
      const meanVal = toFiniteNumber(quartiles.mean_val);
      const stdVal = toFiniteNumber(quartiles.stddev_val);
      let zScoreOutliers = 0;
      if (stdVal > 0) {
        const zCountRow = firstRow(
          await duckdbService.runQuery(
            filePath,
            `SELECT count(*) AS n FROM ${ref}
             WHERE ABS((${q} - ?) / ?) > 3`,
            [meanVal, stdVal],
          ),
        );
        zScoreOutliers = toFiniteNumber(zCountRow.n);
      }

      const totalRow = firstRow(
        await duckdbService.runQuery(filePath, `SELECT count(*) AS n FROM ${ref}`),
      );
      const total = toFiniteNumber(totalRow.n);
      const outlierCount = toFiniteNumber(iqrCountRow.n);

      results.push({
        column: column.columnName,
        method: 'IQR' as const,
        q1,
        q3,
        iqr,
        lowerBound,
        upperBound,
        outlierCount,
        outlierPercent: percent(outlierCount, total),
        totalRows: total,
        zScoreOutliers,
      });
    }

    // Summary
    const totalOutliers = results.reduce((sum, r) => sum + r.outlierCount, 0);
    const columnsWithOutliers = results.filter((r) => r.outlierCount > 0).length;
    const worstColumn = results.length > 0
      ? results.reduce((worst, r) => r.outlierPercent > (worst?.outlierPercent ?? 0) ? r : worst, results[0]!)?.column ?? null
      : null;

    return {
      columns: results,
      summary: { totalOutliers, columnsWithOutliers, worstColumn },
    };
  },

  async getBusinessInsights(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);
    const filePath = await this.filePath(dataset);
    const insights: Array<{
      type: string;
      title: string;
      description: string;
      metric?: string;
      value?: unknown;
      impact: 'high' | 'medium' | 'low';
    }> = [];

    // Dataset size insight
    const totalRow = firstRow(
      await duckdbService.runQuery(filePath, `SELECT count(*) AS n FROM ${csvTableRef(filePath)}`),
    );
    const totalRows = toFiniteNumber(totalRow.n);
    insights.push({
      type: 'DATA_OVERVIEW',
      title: 'Dataset contains records',
      description: `The dataset has ${formatNumber(totalRows)} rows across ${columns.length} columns.`,
      metric: 'Total Records',
      value: totalRows,
      impact: 'medium',
    });

    // Numeric column insights
    const numericCols = columns.filter((col) =>
      isNumericCategory(classifyColumnCategory(col.dataType)),
    );
    for (const col of numericCols.slice(0, 5)) {
      const stats = await this.getColumnStatistics(dataset, columns, col.columnName);
      if ('numeric' in stats) {
        const { mean, median, min, max, stddev } = stats.numeric;
        const cv = mean !== 0 ? (Math.abs(stddev) / Math.abs(mean)) * 100 : 0;

        insights.push({
          type: 'NUMERIC_SUMMARY',
          title: `${col.columnName} overview`,
          description: `Ranges from ${formatNumber(min)} to ${formatNumber(max)} with mean ${formatNumber(mean)}. Coefficient of variation: ${cv.toFixed(1)}%.`,
          metric: col.columnName,
          value: { min, max, mean, median, stddev, cv },
          impact: cv > 50 ? 'high' : cv > 20 ? 'medium' : 'low',
        });
      }
    }

    // Categorical insights
    const catCols = columns.filter((col) =>
      isCategoricalCategory(classifyColumnCategory(col.dataType)),
    );
    for (const col of catCols.slice(0, 3)) {
      const top = await this.getColumnTopValues(dataset, columns, col.columnName, 5);
      if (top.topValues.length > 0) {
        const dominant = top.topValues[0]!;
        insights.push({
          type: 'CATEGORY_DOMINANCE',
          title: `${col.columnName} distribution`,
          description: `"${displayValue(dominant.value)}" is the most common value with ${formatPercent(dominant.percent)} of records.`,
          metric: col.columnName,
          value: top.topValues,
          impact: dominant.percent > 50 ? 'high' : 'medium',
        });
      }
    }

    // Correlation insights
    if (numericCols.length >= 2) {
      const corr = await this.getCorrelation(dataset, columns);
      const strongPairs = corr.pairs
        .filter((p) => p.correlation !== null && Math.abs(p.correlation) > 0.5)
        .sort((a, b) => Math.abs(b.correlation!) - Math.abs(a.correlation!))
        .slice(0, 3);

      for (const pair of strongPairs) {
        insights.push({
          type: 'CORRELATION',
          title: `Strong relationship between ${pair.columnA} and ${pair.columnB}`,
          description: `${pair.columnA} and ${pair.columnB} have a ${pair.correlation! > 0 ? 'positive' : 'negative'} correlation of ${pair.correlation!.toFixed(3)}.`,
          metric: `${pair.columnA} vs ${pair.columnB}`,
          value: pair.correlation,
          impact: Math.abs(pair.correlation!) > 0.7 ? 'high' : 'medium',
        });
      }
    }

    return { insights };
  },

  async getAISummary(dataset: Dataset, columns: DatasetColumn[]) {
    this.assertReady(dataset);

    // Gather all data for summary
    const overview = await this.getOverview(dataset, columns);
    const quality = await this.getQuality(dataset, columns);
    const insights = await this.getInsights(dataset, columns);

    const numericCols = columns.filter((col) =>
      isNumericCategory(classifyColumnCategory(col.dataType)),
    );
    const catCols = columns.filter((col) =>
      isCategoricalCategory(classifyColumnCategory(col.dataType)),
    );
    const dateCols = columns.filter((col) =>
      isDateCategory(classifyColumnCategory(col.dataType)),
    );

    // Build executive summary
    const parts: string[] = [];
    parts.push(`This dataset contains ${formatNumber(overview.rowCount)} rows and ${overview.columnCount} columns.`);
    if (overview.numericColumns > 0) parts.push(`${overview.numericColumns} numeric columns.`);
    if (overview.categoricalColumns > 0) parts.push(`${overview.categoricalColumns} categorical columns.`);
    if (dateCols.length > 0) parts.push(`${dateCols.length} date/time columns.`);
    if (overview.missingPercent > 0) {
      parts.push(`Data quality score is ${quality.healthScore}/100 with ${formatPercent(overview.missingPercent)} missing values.`);
    } else {
      parts.push('Data quality score is 100/100 with no missing values.');
    }
    const executiveSummary = parts.join(' ');

    // Key insights
    const keyInsights = insights.insights.slice(0, 5).map((i) => i.description);

    // Recommendations
    const recommendations: string[] = [];
    if (overview.missingPercent > 5) {
      recommendations.push('Address missing values through imputation or removal before analysis.');
    }
    if (overview.duplicatePercent > 1) {
      recommendations.push('Remove duplicate rows to improve data quality.');
    }
    if (numericCols.length >= 2) {
      recommendations.push('Explore correlations between numeric variables for feature engineering.');
    }
    if (dateCols.length > 0 && numericCols.length > 0) {
      recommendations.push('Analyze time-series trends to identify patterns and seasonality.');
    }
    if (catCols.length > 0) {
      recommendations.push('Examine categorical distributions for potential segmentation.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Dataset appears well-structured. Consider advanced statistical analysis.');
    }

    // Risks
    const risks: string[] = [];
    if (overview.missingPercent > 10) {
      risks.push('High missing value rate may bias analysis results.');
    }
    if (overview.duplicatePercent > 5) {
      risks.push('Significant duplicates could skew statistical measures.');
    }
    if (numericCols.length > 0) {
      // Check for extreme skewness
      for (const col of numericCols.slice(0, 3)) {
        const stats = await this.getColumnStatistics(dataset, columns, col.columnName);
        if ('numeric' in stats && Math.abs(stats.numeric.stddev) > 0) {
          const mean = stats.numeric.mean;
          const median = stats.numeric.median;
          const spread = Math.abs(mean - median) / stats.numeric.stddev;
          if (spread > 0.5) {
            risks.push(`${col.columnName} shows significant skewness - consider transformation.`);
            break;
          }
        }
      }
    }
    if (risks.length === 0) {
      risks.push('No major data quality risks detected.');
    }

    // Suggested analysis
    const suggestedAnalysis: string[] = [];
    if (numericCols.length >= 2) {
      suggestedAnalysis.push('Run correlation analysis to identify feature relationships.');
    }
    if (dateCols.length > 0) {
      suggestedAnalysis.push('Perform time-series decomposition for trend analysis.');
    }
    if (catCols.length > 0 && numericCols.length > 0) {
      suggestedAnalysis.push('Create grouped aggregations by categorical variables.');
    }
    suggestedAnalysis.push('Generate distribution plots for all numeric columns.');
    suggestedAnalysis.push('Perform outlier detection using IQR and Z-score methods.');

    return {
      executiveSummary,
      keyInsights,
      recommendations,
      risks,
      suggestedAnalysis,
      generatedAt: new Date().toISOString(),
    };
  },

  // --- Internal helpers -----------------------------------------------------
  assertReady(dataset: Dataset): void {
    if (dataset.status !== 'READY' || !dataset.storagePath) {
      throw ApiError.conflict(
        'DATASET_NOT_READY',
        'This dataset is not ready for analysis yet',
      );
    }
  },

  async filePath(dataset: Dataset): Promise<string> {
    // Fetches the CSV from Supabase Storage into a local scratch cache that
    // DuckDB reads from. The Supabase object remains the source of truth.
    return storageService.acquireLocalPath(dataset.storagePath!);
  },

  async topValuesForColumn(
    filePath: string,
    columnName: string,
    top: number,
    total: number,
  ): Promise<{ value: unknown; count: number; percent: number }[]> {
    const topN = clampInt(top, 1, 50);
    const q = quoteIdent(columnName);
    const ref = csvTableRef(filePath);
    const rows = await duckdbService.runQuery(
      filePath,
      `SELECT ${q} AS value, count(*) AS count
       FROM ${ref}
       WHERE ${q} IS NOT NULL
       GROUP BY ${q}
       ORDER BY count DESC, value ASC
       LIMIT ${topN}`,
    );
    return rows.map((row) => ({
      value: row.value,
      count: toFiniteNumber(row.count),
      percent: percent(toFiniteNumber(row.count), total),
    }));
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InsightSeverity = 'INFO' | 'LOW' | 'WARNING' | 'GOOD';
type InsightType =
  | 'DATA_QUALITY'
  | 'TREND'
  | 'CORRELATION'
  | 'OUTLIER'
  | 'DISTRIBUTION'
  | 'CATEGORY';

interface Insight {
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Duplicate / row analysis
// ---------------------------------------------------------------------------

interface DuplicateResult {
  totalRows: number;
  duplicateRows: number;
  duplicatePercent: number;
}

async function duplicateAnalysis(filePath: string): Promise<DuplicateResult> {
  const ref = csvTableRef(filePath);
  const rows = await duckdbService.runQuery(
    filePath,
    `WITH __total AS (SELECT count(*) AS n FROM ${ref}),
          __distinct AS (SELECT count(*) AS n FROM (SELECT DISTINCT * FROM ${ref}) __d)
     SELECT __total.n AS total_rows, __total.n - __distinct.n AS duplicate_rows
     FROM __total, __distinct`,
  );
  const row = rows[0] ?? {};
  const totalRows = toFiniteNumber(row.total_rows);
  const duplicateRows = toFiniteNumber(row.duplicate_rows);
  return {
    totalRows,
    duplicateRows,
    duplicatePercent: totalRows > 0 ? (duplicateRows / totalRows) * 100 : 0,
  };
}

// ---------------------------------------------------------------------------
// Health score (deterministic and documented)
// ---------------------------------------------------------------------------

interface HealthInput {
  missingPercent: number;
  duplicatePercent: number;
  invalidPercent: number;
  typeConsistency: number;
}

/**
 * Deterministic health score (0–100), recomputable from the same inputs.
 *
 *   score = clamp(100
 *            - 1.0 × missingPercent
 *            - 1.5 × duplicatePercent
 *            - 1.0 × invalidPercent
 *            - 0.5 × (100 − typeConsistency), 0, 100)
 *
 * Each penalty is surfaced as a visible reason so the score is never a
 * black box.
 */
function computeHealthScore(input: HealthInput): number {
  const penalties =
    1.0 * input.missingPercent +
    1.5 * input.duplicatePercent +
    1.0 * input.invalidPercent +
    0.5 * (100 - input.typeConsistency);
  return Math.round(Math.min(100, Math.max(0, 100 - penalties)));
}

function buildHealthReasons(input: HealthInput): { level: 'good' | 'warning'; title: string; detail: string }[] {
  const reasons: { level: 'good' | 'warning'; title: string; detail: string }[] = [];

  if (input.typeConsistency >= 90) {
    reasons.push({
      level: 'good',
      title: 'Consistent column types',
      detail: `${formatPercent(input.typeConsistency)} of columns have consistent types`,
    });
  } else {
    reasons.push({
      level: 'warning',
      title: 'Inconsistent column types',
      detail: `${formatPercent(100 - input.typeConsistency)} of columns contain non-conforming values`,
    });
  }
  if (input.missingPercent > 0) {
    reasons.push({
      level: 'warning',
      title: 'Missing values',
      detail: `${formatPercent(input.missingPercent)} of cells are missing`,
    });
  }
  if (input.duplicatePercent > 0) {
    reasons.push({
      level: 'warning',
      title: 'Duplicate rows',
      detail: `${formatPercent(input.duplicatePercent)} of rows are duplicates`,
    });
  }
  if (input.invalidPercent > 0) {
    reasons.push({
      level: 'warning',
      title: 'Invalid values',
      detail: `${formatPercent(input.invalidPercent)} of cells could not be parsed into their column type`,
    });
  }
  if (reasons.every((reason) => reason.level === 'good')) {
    reasons.push({
      level: 'good',
      title: 'Clean dataset',
      detail: 'No missing, duplicate or invalid values detected',
    });
  }
  return reasons;
}

function qualityRating(nonNullPct: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (nonNullPct >= 99.5) return 'Excellent';
  if (nonNullPct >= 95) return 'Good';
  if (nonNullPct >= 80) return 'Fair';
  return 'Poor';
}

function describeCorrelation(r: number): string {
  const magnitude = Math.abs(r);
  const direction = r >= 0 ? 'positively' : 'negatively';
  if (magnitude >= 0.7) return `strongly ${direction} correlated`;
  if (magnitude >= 0.4) return `moderately ${direction} correlated`;
  if (magnitude >= 0.2) return `weakly ${direction} correlated`;
  return 'weakly correlated';
}

// ---------------------------------------------------------------------------
// Search builder (explorer-specific; identifiers validated, values parameterized)
// ---------------------------------------------------------------------------

function buildSearchWhere(
  search: ExplorerRequest['search'],
  columns: DatasetColumn[],
): { clause: string; params: unknown[] } {
  if (!search?.term) return { clause: '', params: [] };

  let targets = columns;
  if (search.columns?.length) {
    const wanted = new Set(search.columns);
    targets = columns.filter((column) => wanted.has(column.columnName));
  }

  const like = `%${escapeLike(search.term)}%`;
  const clause = targets
    .map((column) => `CAST(${quoteIdent(column.columnName)} AS VARCHAR) ILIKE ?`)
    .join(' OR ');

  if (!clause) return { clause: '', params: [] };
  return { clause: `(${clause})`, params: targets.map(() => like) };
}

function escapeLike(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function countCategory(
  counts: Map<ColumnCategory, number>,
  predicate: (category: ColumnCategory) => boolean,
): number {
  let total = 0;
  for (const [category, count] of counts) {
    if (predicate(category)) total += count;
  }
  return total;
}

function firstRow(rows: Row[]): Row {
  return rows[0] ?? {};
}

function toFiniteNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return (part / whole) * 100;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.trunc(value), min), max);
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function computeDateRangeDays(minValue: unknown, maxValue: unknown): number | null {
  if (minValue === null || maxValue === null || minValue === undefined || maxValue === undefined) {
    return null;
  }
  const min = new Date(String(minValue)).getTime();
  const max = new Date(String(maxValue)).getTime();
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return Math.round((max - min) / 86_400_000);
}

function formatPeriodLabel(date: Date, granularity: TimeGranularity): string {
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  switch (granularity) {
    case 'day':
    case 'week':
      return `${year}-${month}-${day}`;
    case 'month':
      return `${year}-${month}`;
    case 'quarter':
      return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
    case 'year':
      return String(year);
    default:
      return `${year}-${month}-${day}`;
  }
}
