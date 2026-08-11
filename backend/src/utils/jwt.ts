import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
}

/** Signs a short-lived access token for the given user id. */
export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'ps05-api',
    audience: 'ps05-web',
  });
}

/** Verifies and decodes an access token. Throws if invalid or expired. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: 'ps05-api',
    audience: 'ps05-web',
  });

  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new jwt.JsonWebTokenError('invalid payload');
  }

  return { sub: decoded.sub };
}
