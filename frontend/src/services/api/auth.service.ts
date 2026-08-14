import type { User } from '../../types/auth';
import { api, type ApiSuccess } from '../../lib/api';
import { setAccessToken, clearAccessToken } from '../../lib/authToken';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthPayload {
  user: User;
  token?: string;
}

/**
 * Isolated authentication API service.
 * All auth-related network calls live here.
 */
export const authService = {
  async register(input: RegisterInput): Promise<User> {
    const { data } = await api.post<ApiSuccess<AuthPayload>>(
      '/auth/register',
      input,
    );
    setAccessToken(data.data.token);
    return data.data.user;
  },

  async login(input: LoginInput): Promise<User> {
    const { data } = await api.post<ApiSuccess<AuthPayload>>('/auth/login', input);
    setAccessToken(data.data.token);
    return data.data.user;
  },

  async logout(): Promise<void> {
    await api.post<ApiSuccess<null>>('/auth/logout');
    clearAccessToken();
  },

  /**
   * Returns the current authenticated user, or `null` when not
   * authenticated. Never throws on a missing session.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await api.get<ApiSuccess<AuthPayload>>('/auth/me');
      return data.data.user;
    } catch (error) {
      const status = axiosStatus(error);
      if (status === 401 || status === 403) {
        return null;
      }
      throw error;
    }
  },
};

function axiosStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { status?: number } }).response;
    return response?.status;
  }
  return undefined;
}
