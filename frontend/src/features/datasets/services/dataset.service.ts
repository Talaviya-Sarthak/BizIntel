import type { ApiSuccess } from '../../../types/auth';
import { api } from '../../../lib/api';
import type {
  Dataset,
  DatasetDetailResponse,
  DatasetListResponse,
  DatasetPreviewResponse,
  DatasetSchemaResponse,
  DatasetUploadInput,
} from '../types';

/**
 * Isolated dataset API service. All dataset-related network calls live here.
 */
export const datasetService = {
  async listDatasets(): Promise<DatasetListResponse> {
    const { data } = await api.get<ApiSuccess<DatasetListResponse>>('/datasets');
    return data.data;
  },

  async getDataset(id: string): Promise<DatasetDetailResponse> {
    const { data } = await api.get<ApiSuccess<DatasetDetailResponse>>(`/datasets/${id}`);
    return data.data;
  },

  async getDatasetSchema(id: string): Promise<DatasetSchemaResponse> {
    const { data } = await api.get<ApiSuccess<DatasetSchemaResponse>>(`/datasets/${id}/schema`);
    return data.data;
  },

  async getDatasetPreview(id: string, limit = 20): Promise<DatasetPreviewResponse> {
    const { data } = await api.get<ApiSuccess<DatasetPreviewResponse>>(
      `/datasets/${id}/preview?limit=${limit}`,
    );
    return data.data;
  },

  async uploadDataset(input: DatasetUploadInput): Promise<Dataset> {
    const formData = new FormData();
    formData.append('file', input.file);
    if (input.name) formData.append('name', input.name);
    if (input.description) formData.append('description', input.description);

    const { data } = await api.post<ApiSuccess<{ dataset: Dataset }>>(
      '/datasets',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
        onUploadProgress: (event) => {
          if (event.total && input.onProgress) {
            input.onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      },
    );
    return data.data.dataset;
  },

  async deleteDataset(id: string): Promise<void> {
    await api.delete<ApiSuccess<{ id: string }>>(`/datasets/${id}`);
  },
};
