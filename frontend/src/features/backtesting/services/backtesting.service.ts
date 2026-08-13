import type { ApiSuccess } from '../../../types/auth';
import { api } from '../../../lib/api';
import type {
  BacktestCreateInput,
  BacktestDetail,
  BacktestSummary,
  DatasetDateRange,
  EquitySeriesPoint,
  MarketCompatibility,
  PaginatedTrades,
  StrategyMetadata,
} from '../types';

/** Backtest creation can take seconds on large datasets, so it gets its own timeout. */
const BACKTEST_RUN_TIMEOUT = 120_000;

export const backtestingService = {
  async listStrategies(): Promise<StrategyMetadata[]> {
    const { data } = await api.get<ApiSuccess<StrategyMetadata[]>>('/backtesting/strategies');
    return data.data;
  },

  async getCompatibility(datasetId: string): Promise<MarketCompatibility> {
    const { data } = await api.get<ApiSuccess<MarketCompatibility>>(
      `/backtesting/datasets/${datasetId}`,
    );
    return data.data;
  },

  async getDateRange(datasetId: string): Promise<DatasetDateRange> {
    const { data } = await api.get<ApiSuccess<DatasetDateRange>>(
      `/backtesting/datasets/${datasetId}/range`,
    );
    return data.data;
  },

  async createBacktest(input: BacktestCreateInput): Promise<BacktestSummary> {
    const { data } = await api.post<ApiSuccess<BacktestSummary>>('/backtests', input, {
      timeout: BACKTEST_RUN_TIMEOUT,
    });
    return data.data;
  },

  async listBacktests(): Promise<{ items: BacktestSummary[]; total: number }> {
    const { data } = await api.get<ApiSuccess<{ items: BacktestSummary[]; total: number }>>(
      '/backtests?limit=100',
    );
    return data.data;
  },

  async getBacktest(id: string): Promise<BacktestDetail> {
    const { data } = await api.get<ApiSuccess<BacktestDetail>>(`/backtests/${id}`);
    return data.data;
  },

  async getTrades(id: string, offset = 0, limit = 50): Promise<PaginatedTrades> {
    const { data } = await api.get<ApiSuccess<PaginatedTrades>>(
      `/backtests/${id}/trades?limit=${limit}&offset=${offset}`,
    );
    return data.data;
  },

  async getEquitySeries(id: string): Promise<EquitySeriesPoint[]> {
    const { data } = await api.get<ApiSuccess<EquitySeriesPoint[]>>(`/backtests/${id}/equity`);
    return data.data;
  },

  async deleteBacktest(id: string): Promise<void> {
    await api.delete<ApiSuccess<null>>(`/backtests/${id}`);
  },
};
