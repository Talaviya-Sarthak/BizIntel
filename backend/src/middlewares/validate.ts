import type { RequestHandler } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { ApiError } from '../utils/httpError';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Validates part of the request against a Zod schema at the API boundary.
 * Produces a consistent 422 response with per-field details.
 */
export function validate(
  schema: ZodSchema,
  options: { target?: ValidationTarget } = {},
): RequestHandler {
  const target: ValidationTarget = options.target ?? 'body';

  return (req, _res, next) => {
    const parsed = schema.safeParse(req[target]);

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

    req[target] = parsed.data;
    next();
  };
}
