export type DatasetStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
}

export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  row_count: number | null;
  column_schema: ColumnSchema[];
  status: DatasetStatus;
  created_at: Date;
  updated_at: Date;
}

export type PublicDataset = Omit<Dataset, 'file_path'>;

export function toPublicDataset(dataset: Dataset): PublicDataset {
  const { file_path: _filePath, ...publicDataset } = dataset;
  return publicDataset;
}
