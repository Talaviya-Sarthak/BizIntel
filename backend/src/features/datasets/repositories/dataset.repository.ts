import { pool } from '../../../config/database';
import type { ColumnSchema, Dataset, DatasetStatus } from '../models/dataset.model';

const DATASET_COLUMNS = `
  id,
  user_id,
  name,
  description,
  filename,
  file_path,
  file_size,
  mime_type,
  row_count,
  column_schema,
  status,
  created_at,
  updated_at
` as const;

interface DatasetRow {
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

function mapRow(row: DatasetRow): Dataset {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    filename: row.filename,
    file_path: row.file_path,
    file_size: row.file_size,
    mime_type: row.mime_type,
    row_count: row.row_count,
    column_schema: row.column_schema,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const selectColumns = `SELECT ${DATASET_COLUMNS} FROM datasets`;

export interface CreateDatasetInput {
  userId: string;
  name: string;
  description: string | null;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export async function findById(id: string): Promise<Dataset | null> {
  const result = await pool.query<DatasetRow>(
    `${selectColumns} WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function findByUserId(
  userId: string,
  options: { limit: number; offset: number },
): Promise<Dataset[]> {
  const result = await pool.query<DatasetRow>(
    `${selectColumns} WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, options.limit, options.offset],
  );
  return result.rows.map(mapRow);
}

export async function countByUserId(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM datasets WHERE user_id = $1',
    [userId],
  );
  return parseInt(result.rows[0]!.count, 10);
}

export async function create(input: CreateDatasetInput): Promise<Dataset> {
  const result = await pool.query<DatasetRow>(
    `INSERT INTO datasets (user_id, name, description, filename, file_path, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${DATASET_COLUMNS}`,
    [
      input.userId,
      input.name,
      input.description,
      input.filename,
      input.filePath,
      input.fileSize,
      input.mimeType,
    ],
  );
  return mapRow(result.rows[0]!);
}

export async function updateStatus(
  id: string,
  status: DatasetStatus,
  rowCount?: number,
  columnSchema?: ColumnSchema[],
): Promise<Dataset | null> {
  const result = await pool.query<DatasetRow>(
    `UPDATE datasets
     SET status = $2,
         row_count = COALESCE($3, row_count),
         column_schema = COALESCE($4, column_schema),
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${DATASET_COLUMNS}`,
    [
      id,
      status,
      rowCount ?? null,
      columnSchema ? JSON.stringify(columnSchema) : null,
    ],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
}

export async function deleteById(id: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM datasets WHERE id = $1',
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
