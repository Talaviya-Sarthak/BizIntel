import type { RequestHandler } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { ApiError } from '../utils/httpError';

/**
 * Validates `req.body` against a Zod schema at the API boundary.
 * Produces a consistent 422 response with per-field details.
 */
export function validate(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const details = (parsed.error as ZodError).issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      next(
        ApiError.badRequest(
          'VALIDATION_ERROR',
          'Request validation failed',
          details,
        ),
      );
      return;
    }

    req.body = parsed.data;
    next();
  };
}
