import { api, type ApiSuccess } from '../../../lib/api';
import type {
  StrategyMetadata,
  BacktestDetail,
  BacktestSummary,
  BacktestCreateInput,
} from '../types';

interface StrategiesPayload {
  strategies: StrategyMetadata[];
}

interface BacktestListPayload {
  items: BacktestSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const backtestService = {
  async getStrategies(): Promise<StrategyMetadata[]> {
    const { data } = await api.get<ApiSuccess<StrategiesPayload>>('/backtesting/strategies');
    return data.data.strategies;
  },

  async createBacktest(input: BacktestCreateInput): Promise<{ id: string }> {
    const { data } = await api.post<ApiSuccess<{ id: string }>>('/backtesting', input);
    return data.data;
  },

  async listBacktests(
    page = 1,
    limit = 10
  ): Promise<BacktestListPayload> {
    const { data } = await api.get<ApiSuccess<BacktestListPayload>>('/backtesting', {
      params: { page, limit },
    });
    return data.data;
  },

  async getBacktest(id: string): Promise<BacktestDetail> {
    const { data } = await api.get<ApiSuccess<BacktestDetail>>(`/backtesting/${id}`);
    return data.data;
  },

  async deleteBacktest(id: string): Promise<void> {
    await api.delete<ApiSuccess<null>>(`/backtesting/${id}`);
  },
};
