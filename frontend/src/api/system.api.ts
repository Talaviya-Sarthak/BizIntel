import { api } from '../lib/api';
import type { SystemHealth, SystemMetrics } from '../types/ai.types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const { data } = await api.get<SystemHealth>(`${API_BASE}/system/health`);
  return data;
}

export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const { data } = await api.get<SystemMetrics>(`${API_BASE}/system/metrics`);
  return data;
}
