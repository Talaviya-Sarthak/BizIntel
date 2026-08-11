import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/httpError';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Reads the access token from the auth cookie (primary, web clients) or the
 * `Authorization: Bearer <token>` header (API clients), verifies it, and
 * attaches `req.auth = { userId }`.
 *
 * The token itself is never logged.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    next(
      ApiError.unauthorized('AUTH_NOT_AUTHENTICATED', 'Authentication required'),
    );
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub };
    next();
  } catch {
    next(
      ApiError.unauthorized('AUTH_INVALID_TOKEN', 'Invalid or expired token'),
    );
  }
};

function extractToken(req: Parameters<RequestHandler>[0]): string | undefined {
  const cookieToken = req.cookies?.[env.AUTH_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim() || undefined;
  }

  return undefined;
}
