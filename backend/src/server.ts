import { app } from './app';
import { env } from './config/env';
import { pool } from './config/database';
import { logger } from './config/logger';

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, nodeEnv: env.NODE_ENV },
    'PS-05 Enterprise Intelligence API started',
  );
});

// Configure 15-minute HTTP server timeouts for enterprise document indexing & analytics
server.timeout = 900_000;
server.keepAliveTimeout = 300_000;
server.headersTimeout = 300_000;

/** Graceful shutdown: stop accepting connections, close the DB pool. */
function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down PS-05 API');

  server.close(() => {
    void pool
      .end()
      .catch((error) => {
        logger.error({ err: error }, 'Error closing PostgreSQL pool');
      })
      .finally(() => process.exit(0));
  });

  // Force-exit if graceful shutdown hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
