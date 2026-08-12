import type { RequestHandler } from 'express';
import * as userRepository from '../repositories/user.repository';
import type { UserRole } from '../models/user.model';
import { ApiError } from '../utils/httpError';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Role-based authorization. Must be mounted after `authenticate`.
 *
 * ```
 * router.delete('/:id', authenticate, authorize('owner', 'admin'), handler)
 * ```
 *
 * With no roles, it only verifies that the authenticated account still exists
 * in a valid state.
 */
export function authorize(...roles: UserRole[]): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const userId = req.auth?.userId;
    if (!userId) {
      return next(ApiError.unauthorized('AUTH_NOT_AUTHENTICATED', 'Authentication required'));
    }

    const user = await userRepository.findById(userId);
    if (!user || !user.is_active) {
      return next(
        ApiError.unauthorized('AUTH_INVALID_TOKEN', 'The authentication session is no longer valid'),
      );
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return next(
        ApiError.forbidden('FORBIDDEN', 'You do not have permission to perform this action'),
      );
    }

    next();
  });
}
