import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toApiError } from '../../../lib/api';
import {
  datasetService,
} from '../services/dataset.service';
import type { DatasetUploadInput } from '../types';

export const DATASETS_QUERY_KEY = ['datasets'] as const;
export const DATASET_QUERY_KEY = (id: string) => ['datasets', id] as const;

export function useDatasets() {
  return useQuery({
    queryKey: DATASETS_QUERY_KEY,
    queryFn: datasetService.listDatasets,
  });
}

export function useDataset(id: string | undefined) {
  return useQuery({
    queryKey: DATASET_QUERY_KEY(id ?? ''),
    queryFn: () => datasetService.getDataset(id!),
    enabled: Boolean(id),
  });
}

export function useDatasetSchema(id: string | undefined) {
  return useQuery({
    queryKey: [...DATASET_QUERY_KEY(id ?? ''), 'schema'],
    queryFn: () => datasetService.getDatasetSchema(id!),
    enabled: Boolean(id),
  });
}

export function useDatasetPreview(id: string | undefined, limit = 20) {
  return useQuery({
    queryKey: [...DATASET_QUERY_KEY(id ?? ''), 'preview', limit],
    queryFn: () => datasetService.getDatasetPreview(id!, limit),
    enabled: Boolean(id),
  });
}

/** Upload mutation with query invalidation. Pages own navigation. */
export function useUploadDataset() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: DatasetUploadInput) => datasetService.uploadDataset(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATASETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });

  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => datasetService.deleteDataset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATASETS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
