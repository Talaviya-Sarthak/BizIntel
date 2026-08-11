import { Pool, types as pgTypes } from 'pg';
import { env } from './env';
import { logger } from './logger';

// BIGINT and NUMERIC arrive as strings by default. Dataset row/column counts
// are well within safe integer range, so parse them to JS numbers at the
// driver level to keep the API contract numeric.
pgTypes.setTypeParser(pgTypes.builtins.INT8, (value: string) => Number(value));
pgTypes.setTypeParser(pgTypes.builtins.NUMERIC, (value: string) => Number(value));

/**
 * PostgreSQL connection pool (Neon Serverless PostgreSQL).
 *
 * Connections are created lazily; the first query establishes the pool.
 * Never log the connection string or credentials.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected error on idle PostgreSQL client');
});
