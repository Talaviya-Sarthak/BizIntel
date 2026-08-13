import axios, { AxiosError } from 'axios';
import type { ApiSuccess } from '../types/auth';
import { getAccessToken } from './authToken';

export type { ApiSuccess };
export type { ApiErrorBody, ValidationDetail } from '../types/auth';

/**
 * Centralized API client. All requests go through this instance so error
 * normalization and auth (cookies + Bearer header) are handled in one place.
 *
 * Uses a relative base URL by default so the Vite dev proxy forwards to
 * the backend and httpOnly auth cookies flow same-origin. Override with
 * `VITE_API_URL` when the frontend is served from a different origin.
 */
export const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL as string | undefined),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Attach the in-memory JWT as a Bearer header on every request.
// This ensures cross-origin auth works even when browsers block third-party cookies.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Maps an Axios error to a typed API error body. */
export function toApiError(error: unknown): {
  code: string;
  message: string;
  suggestion?: string;
  details?: { field: string; message: string }[];
} {
  if (axios.isAxiosError(error)) {
    const body = (error as AxiosError).response?.data as
      | {
          error?: {
            code?: string;
            message?: string;
            suggestion?: string;
            details?: { field: string; message: string }[];
          };
        }
      | undefined;
    if (body?.error) {
      const firstDetailMessage = body.error.details?.[0]?.message;
      return {
        code: body.error.code ?? 'UNKNOWN_ERROR',
        message: firstDetailMessage || body.error.message || 'An unexpected error occurred',
        suggestion: body.error.suggestion,
        details: body.error.details,
      };
    }
    if ((error as AxiosError).response) {
      return {
        code: 'HTTP_ERROR',
        message: 'The server returned an unexpected response',
      };
    }
    return { code: 'NETWORK_ERROR', message: 'Unable to reach the server' };
  }
  return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' };
}

function normalizeBaseUrl(value: string | undefined): string {
  if (!value) return '/api/v1';
  return value.replace(/\/+$/, '');
}
