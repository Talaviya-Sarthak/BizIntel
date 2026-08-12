import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { datamartApi } from '../services/datamartApi';
import { DATAMART_QUERY_KEYS } from '../constants/queryKeys';
import { datasetService } from '../../datasets/services/dataset.service';
import { classifyColumnCategory } from '../utils/category';
import type {
  DataMartOverview,
  QueryColumn,
  QueryDatasetSource,
} from '../types';

export function useDataMartOverview() {
  return useQuery({
    queryKey: DATAMART_QUERY_KEYS.overview,
    queryFn: datamartApi.getOverview,
  });
}

export function useRefreshOverview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const queryClientRef = queryClient;
      const data = await datamartApi.getOverview();
      queryClientRef.setQueryData<DataMartOverview>(DATAMART_QUERY_KEYS.overview, data);
      return data;
    },
  });
}

/**
 * All READY datasets plus their schemas, shaped for the query builder.
 * Uses the existing dataset module service so DataMart and Datasets stay in
 * sync (same list, same statuses).
 */
export function useDataMartSources(enabled = true) {
  return useQuery({
    queryKey: DATAMART_QUERY_KEYS.sources,
    queryFn: async (): Promise<QueryDatasetSource[]> => {
      const list = await datasetService.listDatasets();
      const ready = list.datasets.filter((dataset) => dataset.status === 'READY');

      const withColumns = await Promise.all(
        ready.map(async (dataset) => {
          let columns: QueryColumn[] = [];
          try {
            const schema = await datasetService.getDatasetSchema(dataset.id);
            columns = schema.schema.map((column) => ({
              name: column.columnName,
              category: classifyColumnCategory(column.dataType),
              type: column.dataType,
              nullable: column.nullable,
              datasetIds: [dataset.id],
            }));
          } catch {
            columns = [];
          }
          return { id: dataset.id, name: dataset.name, columns };
        }),
      );

      // Deduplicate by column name across datasets and flag ambiguity.
      const byName = new Map<string, QueryColumn>();
      for (const source of withColumns) {
        for (const column of source.columns) {
          const existing = byName.get(column.name);
          if (existing) {
            byName.set(column.name, {
              ...existing,
              datasetIds: [...new Set([...existing.datasetIds, source.id])],
            });
          } else {
            byName.set(column.name, { ...column, datasetIds: [source.id] });
          }
        }
      }

      return withColumns.map((source) => ({
        ...source,
        columns: source.columns.map((column) => {
          const resolved = byName.get(column.name)!;
          return { ...column, datasetIds: resolved.datasetIds };
        }),
      }));
    },
    enabled,
  });
}

export function useDataMartDatasets(enabled = true) {
  return useQuery({
    queryKey: ['datasets'],
    queryFn: datasetService.listDatasets,
    enabled,
  });
}

export { isNumericCategory, isDateCategory } from '../utils/category';
export type { QueryColumn, QueryDatasetSource };
