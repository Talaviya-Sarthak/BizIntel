export const DATASET_STATUSES = [
  'UPLOADING',
  'VALIDATING',
  'PROCESSING',
  'READY',
  'FAILED',
  'DELETED',
] as const;

export type DatasetStatus = (typeof DATASET_STATUSES)[number];

export type DatasetFileType = 'csv' | 'parquet' | 'xlsx' | 'json';

export interface Dataset {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  originalFilename: string;
  fileType: DatasetFileType;
  fileSize: number;
  rowCount: number | null;
  columnCount: number | null;
  status: DatasetStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetColumn {
  id: string;
  datasetId: string;
  columnName: string;
  dataType: string;
  nullable: boolean;
  ordinalPosition: number;
  uniqueCount: number | null;
  nullCount: number | null;
  createdAt: string;
}

export interface DatasetListResponse {
  datasets: Dataset[];
  total: number;
}

export interface DatasetDetailResponse {
  dataset: Dataset;
  columns: DatasetColumn[];
}

export interface DatasetSchemaResponse {
  schema: DatasetColumn[];
}

export interface DatasetPreviewResponse {
  preview: Record<string, unknown>[];
  limit: number;
  truncated: boolean;
}

export interface DatasetUploadInput {
  file: File;
  name?: string;
  description?: string;
  /** Upload byte progress callback (0–100). */
  onProgress?: (percent: number) => void;
}

export interface DashboardSummary {
  datasets: {
    total: number;
    byStatus: {
      READY: number;
      FAILED: number;
      PROCESSING: number;
    };
  };
  recentDatasets: Dataset[];
  analysisRuns: null;
  backtests: null;
  aiConversations: null;
}
