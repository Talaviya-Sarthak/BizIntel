import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { logger } from '../config/logger';

/**
 * Generic API rate limiter — applied to all API routes.
 * Light enough not to interfere with normal usage.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitErrorHandler('API_RATE_LIMITED', 'Too many requests, please try again later.'),
});

/**
 * Strict rate limiter for authentication endpoints to mitigate brute-force
 * and credential-stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitErrorHandler('AUTH_RATE_LIMITED', 'Too many authentication attempts, please try again later.'),
});

function rateLimitErrorHandler(code: string, message: string) {
  return (req: Request, res: Response) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      success: false,
      error: { code, message },
    });
  };
}
