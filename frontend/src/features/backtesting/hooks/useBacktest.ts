import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backtestService } from '../services/backtest.service';
import type { BacktestCreateInput } from '../types';

export function useStrategies() {
  return useQuery({
    queryKey: ['backtesting', 'strategies'],
    queryFn: backtestService.getStrategies,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBacktest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BacktestCreateInput) => backtestService.createBacktest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtesting', 'backtests'] });
    },
  });
}

export function useBacktests(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['backtesting', 'backtests', { page, limit }],
    queryFn: () => backtestService.listBacktests(page, limit),
  });
}

export function useBacktest(id: string | null) {
  return useQuery({
    queryKey: ['backtesting', 'backtests', id],
    queryFn: () => backtestService.getBacktest(id!),
    enabled: !!id,
  });
}

export function useDeleteBacktest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => backtestService.deleteBacktest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtesting', 'backtests'] });
    },
  });
}
