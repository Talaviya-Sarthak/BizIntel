export type UserRole = 'user' | 'owner' | 'admin';

/** Database row for the `users` table. */
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Safe representation of a user that can be exposed via the API. */
export type PublicUser = Omit<User, 'password_hash'>;

/**
 * Strips the password hash before a user object is returned to callers.
 * The `password_hash` field must never cross the API boundary.
 */
export function toPublicUser(user: User): PublicUser {
  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
