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
    console.log('[auth] login response:', JSON.stringify({ hasToken: !!data.data.token, tokenLength: data.data.token?.length, tokenPreview: data.data.token?.substring(0, 30) }));
    setAccessToken(data.data.token);
    console.log('[auth] login: setAccessToken called. localStorage now has:', localStorage.getItem('bizintel_auth_token') ? 'YES' : 'NO');
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
      console.log('[auth] getCurrentUser: success, user =', data.data.user?.email);
      return data.data.user;
    } catch (error) {
      const status = axiosStatus(error);
      console.log('[auth] getCurrentUser: failed, status =', status);
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
