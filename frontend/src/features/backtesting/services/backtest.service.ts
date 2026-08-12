import { api, type ApiSuccess } from '../../../lib/api';
import type {
  StrategyConfig,
  BacktestDetail,
  BacktestListResponse,
  CreateBacktestInput,
} from '../types';

interface StrategiesPayload {
  strategies: StrategyConfig[];
}

export const backtestService = {
  async getStrategies(): Promise<StrategyConfig[]> {
    const { data } = await api.get<ApiSuccess<StrategiesPayload>>('/backtesting/strategies');
    return data.data.strategies;
  },

  async createBacktest(input: CreateBacktestInput): Promise<{ id: string }> {
    const { data } = await api.post<ApiSuccess<{ id: string }>>('/backtests', input);
    return data.data;
  },

  async listBacktests(
    page = 1,
    limit = 10
  ): Promise<BacktestListResponse> {
    const { data } = await api.get<ApiSuccess<BacktestListResponse>>('/backtests', {
      params: { page, limit },
    });
    return data.data;
  },

  async getBacktest(id: string): Promise<BacktestDetail> {
    const { data } = await api.get<ApiSuccess<BacktestDetail>>(`/backtests/${id}`);
    return data.data;
  },

  async deleteBacktest(id: string): Promise<void> {
    await api.delete<ApiSuccess<null>>(`/backtests/${id}`);
  },
};
