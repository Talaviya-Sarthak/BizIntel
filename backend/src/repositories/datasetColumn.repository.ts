import { pool } from '../config/database';
import type { DatasetColumn } from '../models/dataset.model';

const COLUMN_COLUMNS = `
  id,
  dataset_id,
  column_name,
  data_type,
  nullable,
  ordinal_position,
  unique_count,
  null_count,
  created_at
` as const;

interface DatasetColumnRow {
  id: string;
  dataset_id: string;
  column_name: string;
  data_type: string;
  nullable: boolean;
  ordinal_position: number;
  unique_count: number | null;
  null_count: number | null;
  created_at: Date;
}

function mapRow(row: DatasetColumnRow): DatasetColumn {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    columnName: row.column_name,
    dataType: row.data_type,
    nullable: row.nullable,
    ordinalPosition: row.ordinal_position,
    uniqueCount: row.unique_count,
    nullCount: row.null_count,
    createdAt: row.created_at,
  };
}

export interface CreateColumnInput {
  datasetId: string;
  columnName: string;
  dataType: string;
  nullable: boolean;
  ordinalPosition: number;
  uniqueCount: number;
  nullCount: number;
}

export async function createMany(input: CreateColumnInput[]): Promise<void> {
  if (input.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];

  input.forEach((column, index) => {
    const base = index * 8;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`,
    );
    values.push(
      column.datasetId,
      column.columnName,
      column.dataType,
      column.nullable,
      column.ordinalPosition,
      column.uniqueCount,
      column.nullCount,
      new Date(),
    );
  });

  await pool.query(
    `INSERT INTO dataset_columns
       (dataset_id, column_name, data_type, nullable, ordinal_position, unique_count, null_count, created_at)
     VALUES ${placeholders.join(', ')}`,
    values,
  );
}

export async function listByDatasetId(datasetId: string): Promise<DatasetColumn[]> {
  const result = await pool.query<DatasetColumnRow>(
    `SELECT ${COLUMN_COLUMNS}
     FROM dataset_columns
     WHERE dataset_id = $1
     ORDER BY ordinal_position ASC`,
    [datasetId],
  );
  return result.rows.map(mapRow);
}
