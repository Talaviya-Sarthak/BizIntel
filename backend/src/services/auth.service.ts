import bcrypt from 'bcrypt';
import * as userRepository from '../repositories/user.repository.js';
import { ApiError } from '../utils/httpError.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';
import type { PublicUser, User } from '../models/user.model.js';

const BCRYPT_ROUNDS = 10;

/**
 * A valid bcrypt hash of an arbitrary password, used when a login attempts
 * references a non-existent account. Running bcrypt against this dummy hash
 * keeps response timing consistent and reduces user enumeration risk.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-timing-equalizer', BCRYPT_ROUNDS);

export interface AuthResult {
  user: User;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await userRepository.findByEmail(input.email);

  if (existing) {
    throw ApiError.conflict(
      'AUTH_EMAIL_ALREADY_REGISTERED',
      'An account with this email already exists',
    );
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await userRepository.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  return { user };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await userRepository.findByEmail(input.email);

  const passwordMatches = await bcrypt.compare(
    input.password,
    user ? user.password_hash : DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw ApiError.unauthorized(
      'AUTH_INVALID_CREDENTIALS',
      'Invalid email or password',
    );
  }

  if (!user.is_active) {
    throw ApiError.forbidden(
      'AUTH_ACCOUNT_DISABLED',
      'This account has been disabled. Contact an administrator.',
    );
  }

  return { user };
}

export async function getAuthenticatedUser(userId: string): Promise<PublicUser> {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw ApiError.unauthorized(
      'AUTH_INVALID_TOKEN',
      'The authentication session is no longer valid',
    );
  }

  if (!user.is_active) {
    throw ApiError.forbidden(
      'AUTH_ACCOUNT_DISABLED',
      'This account has been disabled. Contact an administrator.',
    );
  }

  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
