import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toApiError } from '../../../lib/api';
import { datamartApi } from '../services/datamartApi';
import { DATAMART_QUERY_KEYS } from '../constants/queryKeys';
import type {
  DataMartCreateDashboardInput,
  DataMartCreateWidgetInput,
  DataMartUpdateDashboardInput,
  DataMartUpdateWidgetInput,
} from '../types';

export function useDashboards(limit = 100, offset = 0) {
  return useQuery({
    queryKey: [...DATAMART_QUERY_KEYS.dashboards, limit, offset] as const,
    queryFn: () => datamartApi.listDashboards({ limit, offset }),
  });
}

export function useDashboard(id: string | undefined) {
  return useQuery({
    queryKey: DATAMART_QUERY_KEYS.dashboard(id ?? ''),
    queryFn: () => datamartApi.getDashboard(id!),
    enabled: Boolean(id),
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: DataMartCreateDashboardInput) => datamartApi.createDashboard(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.dashboards });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.overview });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: DataMartUpdateDashboardInput }) =>
      datamartApi.updateDashboard(id, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.dashboards });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.dashboard(variables.id) });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => datamartApi.deleteDashboard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.dashboards });
      queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.overview });
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

// --- Widgets ---------------------------------------------------------------

export function useCreateWidget(dashboardId: string | undefined) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: DataMartCreateWidgetInput) =>
      datamartApi.createWidget(dashboardId!, input),
    onSuccess: () => {
      if (dashboardId) {
        queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.dashboard(dashboardId) });
      }
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useUpdateWidget(dashboardId: string | undefined) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      widgetId,
      input,
    }: {
      widgetId: string;
      input: DataMartUpdateWidgetInput;
    }) => datamartApi.updateWidget(dashboardId!, widgetId, input),
    onSuccess: () => {
      if (dashboardId) {
        queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.dashboard(dashboardId) });
      }
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useDeleteWidget(dashboardId: string | undefined) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (widgetId: string) => datamartApi.deleteWidget(dashboardId!, widgetId),
    onSuccess: () => {
      if (dashboardId) {
        queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.dashboard(dashboardId) });
      }
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}

export function useReorderWidgets(dashboardId: string | undefined) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (orderedIds: string[]) => datamartApi.reorderWidgets(dashboardId!, orderedIds),
    onSuccess: () => {
      if (dashboardId) {
        queryClient.invalidateQueries({ queryKey: DATAMART_QUERY_KEYS.dashboard(dashboardId) });
      }
    },
  });
  return {
    ...mutation,
    errorMessage: mutation.error ? toApiError(mutation.error).message : null,
  };
}