import axios from 'axios';

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
  const response = await axios.post<IngestResponse>(
    `${API_BASE}/uploads/ingest`,
    { filename, content, fileType },
    { withCredentials: true },
  );
  return response.data;
}

export async function fetchUploads(): Promise<UploadRecord[]> {
  const response = await axios.get<{ success: boolean; uploads: UploadRecord[] }>(
    `${API_BASE}/uploads`,
    { withCredentials: true },
  );
  return response.data.uploads;
}

export async function deleteDocument(fileId: string): Promise<boolean> {
  const response = await axios.delete<{ success: boolean }>(
    `${API_BASE}/uploads/${encodeURIComponent(fileId)}`,
    { withCredentials: true },
  );
  return response.data.success;
}
