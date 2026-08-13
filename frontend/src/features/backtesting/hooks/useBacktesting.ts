import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toApiError } from '../../../lib/api';
import { backtestingService } from '../services/backtesting.service';
import type { BacktestCreateInput } from '../types';

export const BACKTESTING_QUERY_KEYS = {
  strategies: ['backtesting', 'strategies'] as const,
  compatibility: (datasetId: string) => ['backtesting', 'compatibility', datasetId] as const,
  dateRange: (datasetId: string) => ['backtesting', 'dateRange', datasetId] as const,
  list: ['backtesting', 'list'] as const,
  detail: (id: string) => ['backtesting', 'detail', id] as const,
  trades: (id: string, offset: number, limit: number) =>
    ['backtesting', 'detail', id, 'trades', offset, limit] as const,
  equity: (id: string) => ['backtesting', 'detail', id, 'equity'] as const,
};

export function useStrategies() {
  return useQuery({
    queryKey: BACKTESTING_QUERY_KEYS.strategies,
    queryFn: backtestingService.listStrategies,
    staleTime: Infinity,
  });
}

export function useCompatibility(datasetId: string | undefined) {
  return useQuery({
    queryKey: BACKTESTING_QUERY_KEYS.compatibility(datasetId ?? ''),
    queryFn: () => backtestingService.getCompatibility(datasetId!),
    enabled: Boolean(datasetId),
    staleTime: Infinity,
  });
}

export function useDatasetDateRange(datasetId: string | undefined) {
  return useQuery({
    queryKey: BACKTESTING_QUERY_KEYS.dateRange(datasetId ?? ''),
    queryFn: () => backtestingService.getDateRange(datasetId!),
    enabled: Boolean(datasetId),
    staleTime: Infinity,
  });
}

export function useBacktests() {
  return useQuery({
    queryKey: BACKTESTING_QUERY_KEYS.list,
    queryFn: backtestingService.listBacktests,
  });
}

export function useBacktest(id: string | undefined) {
  return useQuery({
    queryKey: BACKTESTING_QUERY_KEYS.detail(id ?? ''),
    queryFn: () => backtestingService.getBacktest(id!),
    enabled: Boolean(id),
  });
}

export function useEquitySeries(id: string | undefined) {
  return useQuery({
    queryKey: BACKTESTING_QUERY_KEYS.equity(id ?? ''),
    queryFn: () => backtestingService.getEquitySeries(id!),
    enabled: Boolean(id),
  });
}

export function useTrades(id: string | undefined, offset = 0, limit = 50) {
  return useQuery({
    queryKey: BACKTESTING_QUERY_KEYS.trades(id ?? '', offset, limit),
    queryFn: () => backtestingService.getTrades(id!, offset, limit),
    enabled: Boolean(id),
  });
}

/** Runs a backtest synchronously; pages navigate to the result afterwards. */
export function useCreateBacktest() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: BacktestCreateInput) => backtestingService.createBacktest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKTESTING_QUERY_KEYS.list });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useDeleteBacktest() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => backtestingService.deleteBacktest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKTESTING_QUERY_KEYS.list });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}
