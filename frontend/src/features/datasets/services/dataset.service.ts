import { api, type ApiSuccess } from '../../../lib/api';
import type {
  Dataset,
  DatasetListResponse,
  DatasetDataResponse,
} from '../types';

export function listDatasets(page = 1, limit = 10) {
  return api
    .get<ApiSuccess<DatasetListResponse>>('/datasets', { params: { page, limit } })
    .then((res) => res.data.data);
}

export function getDataset(id: string) {
  return api
    .get<ApiSuccess<Dataset>>(`/datasets/${id}`)
    .then((res) => res.data.data);
}

export function createDataset(file: File, name: string, description?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  if (description) {
    formData.append('description', description);
  }

  return api
    .post<ApiSuccess<Dataset>>('/datasets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    })
    .then((res) => res.data.data);
}

export function deleteDataset(id: string) {
  return api
    .delete<ApiSuccess<null>>(`/datasets/${id}`)
    .then((res) => res.data);
}

export function getDatasetData(id: string, page = 1, limit = 50) {
  return api
    .get<ApiSuccess<DatasetDataResponse>>(`/datasets/${id}/data`, {
      params: { page, limit },
    })
    .then((res) => res.data.data);
}
