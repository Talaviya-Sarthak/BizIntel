/**
 * Pure market-data column detection and bar validation.
 *
 * These functions NEVER touch DuckDB or PostgreSQL — they operate on the
 * column metadata stored in the database and on in-memory bars, which keeps
 * them fully unit-testable and free of the native `duckdb` dependency.
 */

export interface CandidateColumn {
  /** Exact column name as stored in the dataset. */
  name: string;
  /** Raw DuckDB type, e.g. `VARCHAR`, `DOUBLE`, `DATE`. */
  type: string;
}

export interface MarketColumnMap {
  compatible: boolean;
  dateColumn: string | null;
  openColumn: string | null;
  highColumn: string | null;
  lowColumn: string | null;
  closeColumn: string | null;
  volumeColumn: string | null;
  symbolColumn: string | null;
  issues: string[];
}

const DATE_ALIASES = [
  'date',
  'datetime',
  'timestamp',
  'time',
  'day',
  'trade_date',
  'trading_date',
  'date_time',
  'datetime_utc',
  'datetime_local',
  'exchange_date',
  'obs_date',
];

const OPEN_ALIASES = ['open', 'o', 'open_price', 'price_open', 'opening_price', 'openp'];
const HIGH_ALIASES = ['high', 'h', 'high_price', 'price_high', 'max_price', 'hi'];
const LOW_ALIASES = ['low', 'l', 'low_price', 'price_low', 'min_price', 'lo'];
const CLOSE_ALIASES = [
  'close',
  'c',
  'close_price',
  'price_close',
  'closing_price',
  'adj_close',
  'adjclose',
  'adjusted_close',
  'last',
  'px',
];
const VOLUME_ALIASES = [
  'volume',
  'vol',
  'v',
  'total_volume',
  'volume_total',
  'tick_volume',
  'qty',
  'quantity',
];
const SYMBOL_ALIASES = ['symbol', 'ticker', 'instrument', 'code', 'asset', 'secid'];

function isDateType(type: string): boolean {
  const t = type.toUpperCase();
  return t.startsWith('DATE') || t.startsWith('TIME') || t.includes('TIMESTAMP');
}

function isNumericType(type: string): boolean {
  const t = type.toUpperCase();
  return (
    t === 'DOUBLE' ||
    t === 'FLOAT' ||
    t === 'REAL' ||
    t === 'BIGINT' ||
    t === 'HUGEINT' ||
    t === 'INTEGER' ||
    t === 'SMALLINT' ||
    t === 'TINYINT' ||
    t === 'DECIMAL' ||
    t === 'NUMERIC'
  );
}

/**
 * Detects the market-data columns of a dataset from its stored metadata.
 *
 * Matching order per field: alias match first (a name like "close"/"c"), then
 * a type-based fallback that picks the next unused numeric column. Once a
 * column is assigned it is never reused, so OHLC columns are always distinct.
 * `volume` and `symbol` are optional and matched by alias only.
 */
export function detectMarketColumns(columns: CandidateColumn[]): MarketColumnMap {
  const issues: string[] = [];
  const normalized = columns.map((column) => ({
    name: String(column.name ?? '').trim(),
    type: String(column.type ?? '').trim(),
  }));

  const used = new Set<string>();

  const date = findByAlias(normalized, DATE_ALIASES) ?? normalized.find((column) => isDateType(column.type));
  if (date) used.add(date.name);

  const open = pickByAliasOrNumeric(normalized, OPEN_ALIASES, used);
  const high = pickByAliasOrNumeric(normalized, HIGH_ALIASES, used);
  const low = pickByAliasOrNumeric(normalized, LOW_ALIASES, used);
  const close = pickByAliasOrNumeric(normalized, CLOSE_ALIASES, used);
  const volume = findByAlias(normalized, VOLUME_ALIASES) ?? null;
  const symbol = findByAlias(normalized, SYMBOL_ALIASES) ?? null;

  if (!date) issues.push('No date/time column detected (expected e.g. "date" or "timestamp").');
  if (!open) issues.push('No open price column detected.');
  if (!high) issues.push('No high price column detected.');
  if (!low) issues.push('No low price column detected.');
  if (!close) issues.push('No close price column detected.');

  const uniqueNames = [date?.name, open?.name, high?.name, low?.name, close?.name].filter(Boolean);
  if (uniqueNames.length !== new Set(uniqueNames).size) {
    issues.push('The OHLC columns must be distinct columns.');
  }

  return {
    compatible: issues.length === 0,
    dateColumn: date?.name ?? null,
    openColumn: open?.name ?? null,
    highColumn: high?.name ?? null,
    lowColumn: low?.name ?? null,
    closeColumn: close?.name ?? null,
    volumeColumn: volume?.name ?? null,
    symbolColumn: symbol?.name ?? null,
    issues,
  };
}

function pickByAliasOrNumeric(
  columns: { name: string; type: string }[],
  aliases: string[],
  used: Set<string>,
): { name: string; type: string } | undefined {
  const byAlias = findByAlias(columns, aliases, used);
  if (byAlias) {
    used.add(byAlias.name);
    return byAlias;
  }
  const numeric = columns.find((column) => isNumericType(column.type) && !used.has(column.name));
  if (numeric) used.add(numeric.name);
  return numeric;
}

function findByAlias(
  columns: { name: string; type: string }[],
  aliases: string[],
  used?: Set<string>,
): { name: string; type: string } | undefined {
  const folded = aliases.map((alias) => alias.toLowerCase());
  return columns.find(
    (column) => !used?.has(column.name) && folded.includes(column.name.toLowerCase()),
  );
}

export interface RawBarLike {
  timestamp: unknown;
  open: unknown;
  high: unknown;
  low: unknown;
  close: unknown;
  volume: unknown;
}

/**
 * Validates a chronological bar series and returns human-readable issues.
 *
 * Enforces the invariants the engine relies on: strictly ascending
 * timestamps, no duplicate timestamps, strictly positive prices, finite
 * numbers, and the OHLC consistency `high ≥ max(open, close)` and
 * `low ≤ min(open, close)`. Volume must be ≥ 0 when present.
 */
export function validateMarketData(
  rows: RawBarLike[],
  options: { dateColumn: string; ohlcColumns: { open: string; high: string; low: string; close: string } },
): string[] {
  const issues: string[] = [];
  if (rows.length === 0) {
    issues.push('No market data rows matched the selected date range.');
    return issues;
  }

  const seen = new Set<string>();
  let previous: { timestamp: number; row: RawBarLike } | null = null;

  rows.forEach((row, index) => {
    const timestamp = toTimestamp(row.timestamp);
    const open = toFinite(row.open);
    const high = toFinite(row.high);
    const low = toFinite(row.low);
    const close = toFinite(row.close);
    const volume = row.volume === null || row.volume === undefined ? null : toFinite(row.volume);

    if (timestamp === null) {
      issues.push(`Row ${index + 1}: "${options.dateColumn}" is not a valid timestamp.`);
      return;
    }

    const stamp = String(timestamp);
    if (seen.has(stamp)) {
      issues.push(`Row ${index + 1}: duplicate timestamp ${new Date(timestamp).toISOString()}.`);
    }
    seen.add(stamp);

    if (previous !== null && timestamp <= previous.timestamp) {
      issues.push(
        `Row ${index + 1}: timestamps are not in chronological order (${new Date(timestamp).toISOString()} after ${new Date(previous.timestamp).toISOString()}).`,
      );
    }

    const values: [string, number | null][] = [
      ['open', open],
      ['high', high],
      ['low', low],
      ['close', close],
    ];
    for (const [field, value] of values) {
      if (value === null) {
        issues.push(`Row ${index + 1}: "${options.ohlcColumns[field as keyof typeof options.ohlcColumns]}" is not a valid number.`);
      } else if (value <= 0) {
        issues.push(`Row ${index + 1}: "${options.ohlcColumns[field as keyof typeof options.ohlcColumns]}" must be strictly positive.`);
      }
    }

    if (high !== null && low !== null && open !== null && close !== null) {
      if (high < Math.max(open, close)) {
        issues.push(`Row ${index + 1}: high ${high} is below max(open, close) ${Math.max(open, close)}.`);
      }
      if (low > Math.min(open, close)) {
        issues.push(`Row ${index + 1}: low ${low} is above min(open, close) ${Math.min(open, close)}.`);
      }
    }

    if (volume !== null && volume < 0) {
      issues.push(`Row ${index + 1}: volume cannot be negative.`);
    }

    previous = { timestamp, row };
  });

  return issues;
}

/** Converts a DB/JSON value into an epoch-ms timestamp, or null when invalid. */
export function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function toFinite(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
