import { api } from '../lib/api';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';

export interface IngestResponse {
  success: boolean;
  fileId: string;
  filename: string;
  chunkCount: number;
  message: string;
}

export interface UploadRecord {
  fileId: string;
  filename: string;
  originalName: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
  indexed: boolean;
  chunkCount: number;
  pageCount?: number;
  status?: string;
}

export async function ingestDocument(
  filename: string,
  content: string,
  fileType?: string,
): Promise<IngestResponse> {
  const { data } = await api.post<IngestResponse>(
    `${API_BASE}/uploads/ingest`,
    { filename, content, fileType },
    { timeout: 900_000 },
  );
  return data;
}

export async function fetchUploads(): Promise<UploadRecord[]> {
  const { data } = await api.get<{ success: boolean; uploads: UploadRecord[] }>(
    `${API_BASE}/uploads`,
  );
  return data.uploads;
}

export async function deleteDocument(fileId: string): Promise<boolean> {
  const { data } = await api.delete<{ success: boolean }>(
    `${API_BASE}/uploads/${encodeURIComponent(fileId)}`,
  );
  return data.success;
}
