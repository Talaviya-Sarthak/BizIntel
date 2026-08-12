export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  filename: string;
  file_size: number;
  mime_type: string;
  row_count: number | null;
  column_schema: ColumnSchema[];
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
}

export interface DatasetListResponse {
  items: Dataset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DatasetDataResponse {
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}
