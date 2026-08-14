import type { Response } from 'express';
import { env } from '../config/env.js';
import { signAccessToken } from './jwt.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  path: '/',
};

/**
 * Sets the auth token as an HTTP-only cookie.
 * The token is not exposed to client-side JavaScript, reducing XSS risk.
 */
export function setAuthCookie(res: Response, userId: string): void {
  const token = signAccessToken(userId);
  res.cookie(env.AUTH_COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: durationToMs(env.JWT_EXPIRES_IN),
  });
}

/** Clears the auth cookie (logout). */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.AUTH_COOKIE_NAME, COOKIE_OPTIONS);
}

/** Converts a duration string such as "1h", "30m", "15s", "7d" to ms. */
function durationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    return 60 * 60 * 1000; // default to 1h
  }
  const value = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}
