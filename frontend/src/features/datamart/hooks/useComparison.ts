import { useQuery } from '@tanstack/react-query';
import { datamartApi } from '../services/datamartApi';
import { DATAMART_QUERY_KEYS } from '../constants/queryKeys';

export function useComparison(datasetA: string | undefined, datasetB: string | undefined) {
  return useQuery({
    queryKey: DATAMART_QUERY_KEYS.comparison(datasetA ?? '', datasetB ?? ''),
    queryFn: () => datamartApi.getComparison(datasetA!, datasetB!),
    enabled: Boolean(datasetA && datasetB) && datasetA !== datasetB,
  });
}