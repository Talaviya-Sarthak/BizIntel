import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  listDatasets,
  getDataset,
  createDataset,
  deleteDataset,
  getDatasetData,
} from '../services/dataset.service';

export function useDatasets(page: number, limit: number) {
  return useQuery({
    queryKey: ['datasets', { page, limit }],
    queryFn: () => listDatasets(page, limit),
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: ['dataset', id],
    queryFn: () => getDataset(id),
    enabled: !!id,
  });
}

export function useCreateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      name,
      description,
    }: {
      file: File;
      name: string;
      description?: string;
    }) => createDataset(file, name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDataset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

export function useDatasetData(id: string, page: number, limit: number) {
  return useQuery({
    queryKey: ['datasetData', id, { page, limit }],
    queryFn: () => getDatasetData(id, page, limit),
    enabled: !!id,
  });
}
