import type { Bar, MarketData } from '../strategies/types.js';
import { BACKTEST_ERROR_CODES } from '../types/index.js';
import { ApiError } from '../../utils/httpError.js';
import { duckdbService, csvTableRef, quoteIdent, type Row } from '../../services/duckdb.service.js';
import {
  detectMarketColumns,
  validateMarketData,
  toTimestamp,
  type CandidateColumn,
  type MarketColumnMap,
} from '../marketData/marketColumns.js';

export interface LoadMarketDataInput {
  filePath: string;
  dateColumn: string;
  openColumn: string;
  highColumn: string;
  lowColumn: string;
  closeColumn: string;
  volumeColumn: string | null;
  symbolColumn: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface LoadMarketDataResult {
  symbol: string;
  bars: Bar[];
  totalRows: number;
  rowsAfterFilter: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
}

export interface MarketDataRange {
  /** ISO timestamp of the first usable row, or null when the dataset has none. */
  start: string | null;
  /** ISO timestamp of the last usable row, or null when the dataset has none. */
  end: string | null;
  /** Count of rows that pass the base OHLCV validity filters. */
  totalRows: number;
}

/** Maximum bars the engine will process in one run (safety bound). */
const MAX_BARS = 2_000_000;

/**
 * Loads and validates an OHLCV series from a dataset file via DuckDB.
 *
 * Column identifiers are resolved from stored metadata (never from user
 * input) and quoted; the optional date-range bounds are passed as parameters.
 * Numeric columns are read with TRY_CAST so a single bad cell drops that row
 * instead of failing the whole query.
 */
export const marketDataService = {
  async load(input: LoadMarketDataInput): Promise<LoadMarketDataResult> {
    const bounds = buildDateBounds(input.startDate, input.endDate);
    const { selectExprs, whereParts } = buildSourceParts(input);
    const params: unknown[] = [];
    if (bounds.start !== null) {
      whereParts.push(`__ts >= ?`);
      params.push(new Date(bounds.start).toISOString());
    }
    if (bounds.end !== null) {
      whereParts.push(`__ts <= ?`);
      params.push(new Date(bounds.end).toISOString());
    }

    const sql = `
      SELECT __ts AS ts, ${quoteIdent(input.openColumn)}, ${quoteIdent(input.highColumn)},
             ${quoteIdent(input.lowColumn)}, ${quoteIdent(input.closeColumn)}, __volume, __symbol
      FROM (
        SELECT ${selectExprs.join(', ')}
        FROM ${csvTableRef(input.filePath)}
      ) __src
      WHERE ${whereParts.join(' AND ')}
      ORDER BY __ts ASC`;

    const rows = await duckdbService.runQuery(input.filePath, sql, params);
    if (rows.length === 0) {
      const range = await this.range(input);
      throw ApiError.badRequest(
        BACKTEST_ERROR_CODES.INSUFFICIENT_DATA,
        describeEmptyRange(input, range),
        {
          requested: {
            startDate: input.startDate ?? null,
            endDate: input.endDate ?? null,
          },
          available: range,
        },
        'Pick a date range inside the dataset span, or leave the date range empty to use all data.',
      );
    }
    if (rows.length > MAX_BARS) {
      throw ApiError.badRequest(
        BACKTEST_ERROR_CODES.INVALID_MARKET_DATA,
        `Dataset contains ${rows.length.toLocaleString()} rows in range; the engine supports at most ${MAX_BARS.toLocaleString()} bars`,
        undefined,
        'Narrow the date range so fewer rows are processed in a single run.',
      );
    }

    const ohlcColumns = {
      open: input.openColumn,
      high: input.highColumn,
      low: input.lowColumn,
      close: input.closeColumn,
    };
    const issues = validateMarketData(
      rows.map((row) => ({
        timestamp: row.ts,
        open: row[input.openColumn],
        high: row[input.highColumn],
        low: row[input.lowColumn],
        close: row[input.closeColumn],
        volume: row.__volume,
      })),
      { dateColumn: input.dateColumn, ohlcColumns },
    );
    if (issues.length > 0) {
      const sample = issues.slice(0, 5).join(' ');
      throw ApiError.badRequest(
        BACKTEST_ERROR_CODES.INVALID_MARKET_DATA,
        `Market data validation failed: ${sample}${issues.length > 5 ? ` (and ${issues.length - 5} more)` : ''}`,
        { count: issues.length, issues: issues.slice(0, 50) },
        'Fix the invalid values in the dataset (prices must be positive, timestamps unique and chronological).',
      );
    }

    const bars: Bar[] = rows.map((row) => ({
      timestamp: toTimestamp(row.ts) as number,
      open: toFinite(row[input.openColumn]),
      high: toFinite(row[input.highColumn]),
      low: toFinite(row[input.lowColumn]),
      close: toFinite(row[input.closeColumn]),
      volume: row.__volume === null || row.__volume === undefined ? null : toFinite(row.__volume),
    }));

    const symbol = resolveSymbol(rows, input.symbolColumn);

    return {
      symbol,
      bars,
      totalRows: rows.length,
      rowsAfterFilter: bars.length,
      firstTimestamp: bars.length > 0 ? new Date(bars[0]!.timestamp).toISOString() : null,
      lastTimestamp: bars.length > 0 ? new Date(bars[bars.length - 1]!.timestamp).toISOString() : null,
    };
  },

  detect(columns: CandidateColumn[]): MarketColumnMap {
    return detectMarketColumns(columns);
  },

  /**
   * Returns the available date span and count of usable OHLCV rows, ignoring
   * the requested date bounds. Lets callers (and error messages) tell users
   * what range a dataset actually covers.
   */
  async range(input: LoadMarketDataInput): Promise<MarketDataRange> {
    const { selectExprs, whereParts } = buildSourceParts(input);
    const sql = `
      SELECT min(__ts) AS __min_ts, max(__ts) AS __max_ts, count(*) AS __total
      FROM (
        SELECT ${selectExprs.join(', ')}
        FROM ${csvTableRef(input.filePath)}
      ) __src
      WHERE ${whereParts.join(' AND ')}`;

    const rows = await duckdbService.runQuery(input.filePath, sql);
    const row = rows[0];
    const minTs = row?.__min_ts === null || row?.__min_ts === undefined ? null : toTimestamp(row.__min_ts);
    const maxTs = row?.__max_ts === null || row?.__max_ts === undefined ? null : toTimestamp(row.__max_ts);
    return {
      start: minTs === null ? null : new Date(minTs).toISOString(),
      end: maxTs === null ? null : new Date(maxTs).toISOString(),
      totalRows: Number(row?.__total ?? 0),
    };
  },
};

function buildSourceParts(input: LoadMarketDataInput): {
  selectExprs: string[];
  whereParts: string[];
} {
  const ohlc = [input.openColumn, input.highColumn, input.lowColumn, input.closeColumn];
  const selectExprs = [
    `CAST(${quoteIdent(input.dateColumn)} AS TIMESTAMP) AS __ts`,
    ...ohlc.map((name) => `TRY_CAST(${quoteIdent(name)} AS DOUBLE) AS ${quoteIdent(name)}`),
  ];
  if (input.volumeColumn) {
    selectExprs.push(`TRY_CAST(${quoteIdent(input.volumeColumn)} AS DOUBLE) AS __volume`);
  } else {
    selectExprs.push('NULL AS __volume');
  }
  if (input.symbolColumn) {
    selectExprs.push(`CAST(${quoteIdent(input.symbolColumn)} AS VARCHAR) AS __symbol`);
  } else {
    selectExprs.push('NULL AS __symbol');
  }
  return {
    selectExprs,
    whereParts: [`__ts IS NOT NULL`, `"${input.closeColumn}" IS NOT NULL`],
  };
}

function describeEmptyRange(input: LoadMarketDataInput, range: MarketDataRange): string {
  const requested =
    input.startDate && input.endDate
      ? `for ${input.startDate} → ${input.endDate}`
      : input.startDate
        ? `on or after ${input.startDate}`
        : input.endDate
          ? `on or before ${input.endDate}`
          : 'in the dataset';
  if (range.start && range.end) {
    return `No market data rows matched ${requested}. This dataset spans ${formatDate(range.start)} → ${formatDate(range.end)} — choose dates inside that range`;
  }
  return 'No market data rows matched the selected date range: the dataset contains no usable OHLCV rows';
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function buildDateBounds(startDate?: string | null, endDate?: string | null): { start: number | null; end: number | null } {
  const start = startDate ? Date.parse(startDate) : NaN;
  const end = endDate ? Date.parse(endDate) : NaN;
  if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
    throw ApiError.badRequest(
      BACKTEST_ERROR_CODES.INVALID_DATE_RANGE,
      'Start date must not be after end date',
      undefined,
      'Make sure the start date is on or before the end date.',
    );
  }
  return {
    start: Number.isNaN(start) ? null : start,
    end: Number.isNaN(end) ? null : end,
  };
}

function resolveSymbol(rows: Row[], symbolColumn: string | null): string {
  if (!symbolColumn) return 'ASSET';
  for (const row of rows) {
    const value = row.__symbol;
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value).trim().slice(0, 32);
    }
  }
  return 'ASSET';
}

function toFinite(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
