import type { Request, Response } from 'express';
import { appInfo } from '../config/app';
import { pool } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Liveness + database connectivity probe.
 * Never leaks the connection string or database internals.
 */
export const health = asyncHandler(async (_req: Request, res: Response) => {
  let database: 'up' | 'down' = 'down';

  try {
    await pool.query('SELECT 1');
    database = 'up';
  } catch {
    database = 'down';
  }

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: appInfo.name,
      version: appInfo.version,
      database,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});
