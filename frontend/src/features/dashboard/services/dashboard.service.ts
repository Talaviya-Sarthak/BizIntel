import type { ApiSuccess } from '../../../types/auth';
import { api } from '../../../lib/api';
import type { DashboardSummary } from '../types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const { data } = await api.get<ApiSuccess<DashboardSummary>>('/dashboard/summary');
    return data.data;
  },
};
