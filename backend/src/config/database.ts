import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

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
