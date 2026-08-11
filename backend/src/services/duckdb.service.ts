import duckdb from 'duckdb';
import {
  classifyColumnCategory,
  type ColumnCategory,
} from '../types/analytics';

type DuckDb = duckdb.Database;
export type Row = Record<string, unknown>;

/**
 * Analytical processing engine for uploaded datasets.
 *
 * PostgreSQL stores metadata; DuckDB performs the actual scanning: schema
 * detection, row counting, column profiling and previews. All DuckDB logic is
 * isolated here — never inside route handlers or controllers.
 */
export interface InspectedColumn {
  name: string;
  /** Raw DuckDB type, e.g. `VARCHAR`, `BIGINT`, `DOUBLE`. */
  type: string;
  /** Normalized category: integer | float | decimal | boolean | date | time | datetime | uuid | string. */
  category: string;
  nullCount: number;
  uniqueCount: number;
}

export interface InspectResult {
  columns: InspectedColumn[];
  rowCount: number;
}

export class DuckDBService {
  /** Opens the CSV, detects the schema, counts rows and profiles columns. */
  async inspectCsv(filePath: string): Promise<InspectResult> {
    const db = new duckdb.Database(':memory:');
    try {
      const ref = csvTableRef(filePath);

      const describeRows = await query(db, `DESCRIBE SELECT * FROM ${ref}`);
      const columns = describeRows.map((row) => ({
        name: String(row.column_name ?? ''),
        type: String(row.column_type ?? 'VARCHAR'),
      }));

      const countRow = await query(db, `SELECT count(*) AS __total FROM ${ref}`);
      const rowCount = Number(countRow[0]?.__total ?? 0);

      const profileRow = await buildProfileRow(db, ref, columns);
      const profiles = columns.map((column, index) => ({
        nullCount: Math.max(
          rowCount - Number(profileRow[`__nn_${index}`] ?? 0),
          0,
        ),
        uniqueCount: Number(profileRow[`__un_${index}`] ?? 0),
      }));

      return {
        columns: columns.map((column, index) => ({
          name: column.name,
          type: column.type,
          category: classifyColumnCategory(column.type),
          nullCount: profiles[index]!.nullCount,
          uniqueCount: profiles[index]!.uniqueCount,
        })),
        rowCount,
      };
    } finally {
      await close(db);
    }
  }

  /** Returns a limited set of data rows (strict row cap, never the full file). */
  async previewCsv(filePath: string, limit: number): Promise<Row[]> {
    const db = new duckdb.Database(':memory:');
    try {
      const safeLimit = Math.min(Math.max(limit, 1), 100);
      const ref = csvTableRef(filePath);
      const rows = await query(db, `SELECT * FROM ${ref} LIMIT ${safeLimit}`);
      return rows.map(toJsonSafe);
    } finally {
      await close(db);
    }
  }

  /**
   * Runs a read-only SQL statement against the CSV file. Callers (Analytics
   * Service) own the SQL; identifiers must be validated + quoted before
   * reaching here. Values are always passed as positional `?` parameters.
   */
  async runQuery(filePath: string, sql: string, params: unknown[] = []): Promise<Row[]> {
    const db = new duckdb.Database(':memory:');
    try {
      const rows = await query(db, sql, params);
      return rows.map(toJsonSafe);
    } finally {
      await close(db);
    }
  }
}

/** Builds a single aggregate query returning null/unique counts per column. */
async function buildProfileRow(
  db: DuckDb,
  ref: string,
  columns: { name: string }[],
): Promise<Row> {
  const parts: string[] = ['count(*) AS __total'];
  columns.forEach((column, index) => {
    parts.push(`count(${quoteIdent(column.name)}) AS "__nn_${index}"`);
    parts.push(`count(DISTINCT ${quoteIdent(column.name)}) AS "__un_${index}"`);
  });

  const rows = await query(db, `SELECT ${parts.join(', ')} FROM ${ref}`);
  return rows[0] ?? {};
}

function query(db: DuckDb, sql: string, params: unknown[] = []): Promise<Row[]> {
  return new Promise((resolve, reject) => {
    const done = (err: Error | null, rows: Row[] | null) => {
      if (err) reject(err);
      else resolve((rows ?? []) as Row[]);
    };
    // duckdb-node expects parameters spread, not an array.
    if (params.length > 0) {
      db.all(sql, ...(params as never[]), done);
    } else {
      db.all(sql, done);
    }
  });
}

function close(db: DuckDb): Promise<void> {
  return new Promise((resolve) => {
    try {
      db.close(() => resolve());
    } catch {
      resolve();
    }
  });
}

/** Safe read_csv table reference with normalized Windows paths. */
export function csvTableRef(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const escaped = normalized.replace(/'/g, "''");
  return `read_csv('${escaped}', header=true, sample_size=-1)`;
}

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Converts DuckDB result values to JSON-safe primitives. */
function toJsonSafe(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = jsonSafeValue(value);
  }
  return out;
}

function jsonSafeValue(value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return Buffer.from(value).toString('hex');
  if (Array.isArray(value)) return value.map(jsonSafeValue);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = jsonSafeValue(entry);
    }
    return out;
  }
  return value;
}

/** Application-wide DuckDB processing service. */
export const duckdbService = new DuckDBService();
