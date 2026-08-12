import axios from 'axios';

const API_BASE = '/api/v1';

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
