import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toApiError } from '../../../lib/api';
import { datamartApi } from '../services/datamartApi';
import { DATAMART_QUERY_KEYS } from '../constants/queryKeys';
import type {
  DataMartCreateMetricInput,
  DataMartUpdateMetricInput,
} from '../types';

export function useMetrics(datasetId?: string, limit = 100, offset = 0) {
  return useQuery({
    queryKey: [...DATAMART_QUERY_KEYS.metrics, datasetId ?? 'all', limit, offset] as const,
    queryFn: () => datamartApi.listMetrics({ limit, offset, datasetId }),
  });
}

export function useMetric(id: string | undefined) {
  return useQuery({
    queryKey: DATAMART_QUERY_KEYS.metric(id ?? ''),
    queryFn: () => datamartApi.getMetric(id!),
    enabled: Boolean(id),
  });
}

export function useCreateMetric() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: DataMartCreateMetricInput) => datamartApi.createMetric(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.overview });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useUpdateMetric() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DataMartUpdateMetricInput }) =>
      datamartApi.updateMetric(id, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.metric(variables.id) });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useDeleteMetric() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => datamartApi.deleteMetric(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.metrics });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.overview });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

/** Executes a reusable metric (returns metric + result). */
export function useExecuteMetric() {
  const mutation = useMutation({
    mutationFn: (id: string) => datamartApi.executeMetric(id),
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}