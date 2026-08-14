import { api } from '../lib/api';
import type { SystemHealth, SystemMetrics } from '../types/ai.types';

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const { data } = await api.get<SystemHealth>('/system/health');
  return data;
}

export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const { data } = await api.get<SystemMetrics>('/system/metrics');
  return data;
}
