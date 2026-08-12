import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toApiError } from '../../../lib/api';
import { datamartApi } from '../services/datamartApi';
import { DATAMART_QUERY_KEYS } from '../constants/queryKeys';
import type {
  DataMartCreateAnalysisInput,
  DataMartUpdateAnalysisInput,
} from '../types';

export function useAnalyses(limit = 100, offset = 0) {
  return useQuery({
    queryKey: [...DATAMART_QUERY_KEYS.analyses, limit, offset] as const,
    queryFn: () => datamartApi.listAnalyses({ limit, offset }),
  });
}

export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: DATAMART_QUERY_KEYS.analysis(id ?? ''),
    queryFn: () => datamartApi.getAnalysis(id!),
    enabled: Boolean(id),
  });
}

export function useAnalysisRuns(id: string | undefined, limit = 50) {
  return useQuery({
    queryKey: [...DATAMART_QUERY_KEYS.analysisRuns(id ?? ''), limit] as const,
    queryFn: () => datamartApi.listAnalysisRuns(id!, { limit }),
    enabled: Boolean(id),
  });
}

/** Executes a saved analysis; pages navigate to the result afterwards. */
export function useExecuteAnalysis() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => datamartApi.executeAnalysis(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.analysisRuns(id) });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.overview });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useCreateAnalysis() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: DataMartCreateAnalysisInput) => datamartApi.createAnalysis(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.analyses });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.overview });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useUpdateAnalysis() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DataMartUpdateAnalysisInput }) =>
      datamartApi.updateAnalysis(id, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.analyses });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.analysis(variables.id) });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => datamartApi.deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.analyses });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.overview });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}