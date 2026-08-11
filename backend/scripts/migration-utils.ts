import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool, type PoolClient } from 'pg';

export interface MigrationFile {
  version: number;
  name: string;
  path: string;
  sql: string;
  checksum: string;
}

export interface AppliedMigration {
  version: number;
  name: string;
  checksum: string;
  appliedAt: Date;
}

export const SCHEMA_MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER     PRIMARY KEY,
    name       TEXT        NOT NULL,
    checksum   TEXT        NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

/** Repository root — works when scripts run via tsx from `backend/scripts`. */
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const MIGRATIONS_DIR = path.join(REPO_ROOT, 'database', 'migrations');

export function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Loads `.env` (backend then repo root) and returns a raw value for
 * DATABASE_URL. Scripts deliberately read the env directly instead of the
 * application's strict config so DB tooling does not require JWT secrets.
 */
export function loadDatabaseUrl(): string {
  const dotenv = require('dotenv');
  dotenv.config({
    path: [
      path.resolve(process.cwd(), '.env'),
      path.join(REPO_ROOT, '.env'),
    ],
    override: false,
  });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      'DATABASE_URL is not set. Copy .env.example to .env and configure it.',
    );
    process.exit(1);
  }
  return databaseUrl;
}

export function createPool(): Pool {
  const databaseUrl = loadDatabaseUrl();
  return new Pool({ connectionString: databaseUrl });
}

/** Reads and validates all migration files, ordered by version. */
export function getMigrationFiles(): MigrationFile[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const migrations: MigrationFile[] = [];

  for (const file of files) {
    const match = /^(\d+)_/.exec(file);
    if (!match) {
      console.error(
        `Migration filename must start with a numeric version prefix: ${file}`,
      );
      process.exit(1);
    }
    const version = Number(match[1]);
    if (migrations.some((m) => m.version === version)) {
      console.error(`Duplicate migration version ${version} in: ${file}`);
      process.exit(1);
    }
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    migrations.push({ version, name: file, path: filePath, sql, checksum: sha256(sql) });
  }

  return migrations;
}

export async function getAppliedMigrations(pool: Pool): Promise<AppliedMigration[]> {
  await pool.query(SCHEMA_MIGRATIONS_TABLE_SQL);
  const result = await pool.query<{
    version: number;
    name: string;
    checksum: string;
    applied_at: Date;
  }>(`SELECT version, name, checksum, applied_at FROM schema_migrations ORDER BY version`);

  return result.rows.map((row) => ({
    version: row.version,
    name: row.name,
    checksum: row.checksum,
    appliedAt: row.applied_at,
  }));
}

/** Applies one migration inside a transaction and records it. */
export async function applyMigration(client: PoolClient, migration: MigrationFile): Promise<void> {
  await client.query('BEGIN');
  try {
    await client.query(SCHEMA_MIGRATIONS_TABLE_SQL);
    await client.query(migration.sql);
    await client.query(
      `INSERT INTO schema_migrations (version, name, checksum)
       VALUES ($1, $2, $3)`,
      [migration.version, migration.name, migration.checksum],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
