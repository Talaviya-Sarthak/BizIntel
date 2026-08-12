import duckdb from 'duckdb';
import { logger } from './logger';

let db: duckdb.Database | null = null;

function getDb(): duckdb.Database {
  if (!db) {
    db = new duckdb.Database(':memory:');
    logger.info('DuckDB in-memory database initialized');
  }
  return db;
}

function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.all(sql, ...params, (err: Error | null, rows: unknown[]) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows as T[]);
    });
  });
}

function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    database.run(sql, ...params, (err: Error | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export async function registerCsv(
  tableName: string,
  filePath: string,
): Promise<void> {
  const escapedPath = filePath.replace(/'/g, "''");
  await run(
    `CREATE OR REPLACE VIEW "${tableName}" AS SELECT * FROM read_csv_auto('${escapedPath}', header=true, all_varchar=false)`,
  );
}

export async function getRowCount(tableName: string): Promise<number> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*)::int AS cnt FROM "${tableName}"`,
  );
  return rows[0]!.cnt;
}

export async function getColumnSchema(
  tableName: string,
): Promise<{ name: string; type: string; nullable: boolean }[]> {
  const rows = await query<{ column_name: string; data_type: string; is_nullable: string }>(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = $1
     ORDER BY ordinal_position`,
    [tableName],
  );

  return rows.map((row) => ({
    name: row.column_name,
    type: row.data_type,
    nullable: row.is_nullable === 'YES',
  }));
}

export async function getData(
  tableName: string,
  options: { limit: number; offset: number },
): Promise<Record<string, unknown>[]> {
  return query(
    `SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2`,
    [options.limit, options.offset],
  );
}

export async function dropTable(tableName: string): Promise<void> {
  await run(`DROP VIEW IF EXISTS "${tableName}"`);
}

export const duckdbService = {
  registerCsv,
  getRowCount,
  getColumnSchema,
  getData,
  dropTable,
};
