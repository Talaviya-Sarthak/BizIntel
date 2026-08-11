import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { ApiError } from '../utils/httpError';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource does not exist',
    },
  });
};

/**
 * Centralized error handler. Guarantees a consistent error response shape
 * and never leaks stack traces or internal details in production.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    logger.warn({ code: err.code, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
      },
    });
    return;
  }

  const isUniqueViolation = typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
  const isForeignKeyViolation = typeof err === 'object' && err !== null && (err as { code?: string }).code === '23503';

  if (isUniqueViolation) {
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'The resource already exists' },
    });
    return;
  }

  if (isForeignKeyViolation) {
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'The operation violates a data relationship' },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
};
