import axios from 'axios';
import type { SystemHealth, SystemMetrics } from '../types/ai.types';

const API_BASE = '/api/v1';

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const response = await axios.get<SystemHealth>(`${API_BASE}/system/health`, {
    withCredentials: true,
  });
  return response.data;
}

export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  const response = await axios.get<SystemMetrics>(`${API_BASE}/system/metrics`, {
    withCredentials: true,
  });
  return response.data;
}
