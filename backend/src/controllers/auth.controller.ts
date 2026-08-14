import type { Request, Response } from 'express';
import { toPublicUser } from '../models/user.model.js';
import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies.js';
import { signAccessToken } from '../utils/jwt.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user } = await authService.register(req.body);

  setAuthCookie(res, user.id);

  res.status(201).json({
    success: true,
    data: { user: toPublicUser(user), token: signAccessToken(user.id) },
    message: 'Account created successfully',
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user } = await authService.login(req.body);

  setAuthCookie(res, user.id);

  res.status(200).json({
    success: true,
    data: { user: toPublicUser(user), token: signAccessToken(user.id) },
    message: 'Signed in successfully',
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Signed out successfully',
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getAuthenticatedUser(req.auth!.userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
});
