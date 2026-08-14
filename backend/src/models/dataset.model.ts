import type { DatasetFileType, DatasetStatus } from '../types/dataset.js';

/** Database row for the `datasets` table. */
/** A single column entry in the stored JSONB `schema`. */
export interface DatasetSchemaColumn {
  name: string;
  /** Normalized category: integer | float | decimal | boolean | date | time | datetime | uuid | string. */
  type: string;
  /** Raw detected DuckDB type, e.g. `VARCHAR`, `BIGINT`, `DOUBLE`. */
  dataType: string;
  nullable: boolean;
  nullCount: number;
  uniqueCount: number;
}

/** JSONB column schema stored on the `datasets` row (metadata only, never row data). */
export interface DatasetSchema {
  columns: DatasetSchemaColumn[];
}

export interface Dataset {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  originalFilename: string;
  /** Opaque storage key managed by StorageService (e.g. `{userId}/{datasetId}.csv`). */
  storagePath: string | null;
  /** Supabase Storage bucket the CSV object lives in (e.g. `datamart-datasets`). */
  storageBucket: string | null;
  /** Detected column schema stored as JSONB in PostgreSQL. */
  schema: DatasetSchema | null;
  contentType: string | null;
  /** SHA-256 hex digest of the stored CSV. */
  checksum: string | null;
  fileType: DatasetFileType;
  fileSize: number;
  rowCount: number | null;
  columnCount: number | null;
  status: DatasetStatus;
  /** Processing failure reason (the `processing_error` column). */
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Database row for the `dataset_columns` table. */
export interface DatasetColumn {
  id: string;
  datasetId: string;
  columnName: string;
  /** DuckDB type, e.g. `VARCHAR`, `BIGINT`, `DOUBLE`, `DATE`. */
  dataType: string;
  nullable: boolean;
  ordinalPosition: number;
  uniqueCount: number | null;
  nullCount: number | null;
  createdAt: Date;
}

/**
 * Public dataset representation exposed via the API. Storage paths/bucket are
 * intentionally omitted — clients never need to know where files live.
 */
export type PublicDataset = Omit<Dataset, 'storagePath' | 'storageBucket'>;

export function toPublicDataset(dataset: Dataset): PublicDataset {
  const { storagePath: _storagePath, storageBucket: _storageBucket, ...publicDataset } = dataset;
  return publicDataset;
}
