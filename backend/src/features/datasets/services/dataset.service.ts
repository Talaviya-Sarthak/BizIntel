import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse';
import { duckdbService } from '../../../config/duckdb';
import { ApiError } from '../../../utils/httpError';
import { toPublicDataset } from '../models/dataset.model';
import type { ColumnSchema, Dataset, PublicDataset } from '../models/dataset.model';
import * as datasetRepository from '../repositories/dataset.repository';
import type { ListDatasetsInput } from '../validators/dataset.validator';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'datasets');

async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

function getTableName(datasetId: string): string {
  return `dataset_${datasetId.replace(/-/g, '_')}`;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listDatasets(
  userId: string,
  options: ListDatasetsInput,
): Promise<PaginatedResult<PublicDataset>> {
  const offset = (options.page - 1) * options.limit;
  const [datasets, total] = await Promise.all([
    datasetRepository.findByUserId(userId, { limit: options.limit, offset }),
    datasetRepository.countByUserId(userId),
  ]);

  return {
    items: datasets.map(toPublicDataset),
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit),
  };
}

export async function getDataset(
  userId: string,
  datasetId: string,
): Promise<PublicDataset> {
  const dataset = await datasetRepository.findById(datasetId);

  if (!dataset) {
    throw ApiError.notFound('DATASET_NOT_FOUND', 'Dataset not found');
  }

  if (dataset.user_id !== userId) {
    throw ApiError.forbidden('DATASET_ACCESS_DENIED', 'You do not have access to this dataset');
  }

  return toPublicDataset(dataset);
}

function parseCsvStream(filePath: string): Promise<{ records: Record<string, unknown>[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const records: Record<string, unknown>[] = [];
    let headers: string[] = [];

    const parser = filePath
      ? require('fs').createReadStream(filePath).pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
          }),
        )
      : parse({ columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });

    parser.on('data', (record: Record<string, unknown>) => {
      if (records.length === 0) {
        headers = Object.keys(record);
      }
      records.push(record);
    });

    parser.on('end', () => {
      resolve({ records, headers });
    });

    parser.on('error', (err: Error) => {
      reject(err);
    });
  });
}

function inferColumnTypes(records: Record<string, unknown>[], headers: string[]): ColumnSchema[] {
  return headers.map((header) => {
    let nullable = false;
    let type = 'string';

    for (const record of records) {
      const value = record[header];
      if (value === null || value === undefined || value === '') {
        nullable = true;
        continue;
      }

      const strValue = String(value).trim();
      if (strValue === '') {
        nullable = true;
        continue;
      }

      if (/^-?\d+$/.test(strValue)) {
        type = 'integer';
      } else if (/^-?\d+\.\d+$/.test(strValue)) {
        type = 'double';
      } else if (/^(true|false)$/i.test(strValue)) {
        type = 'boolean';
      } else if (/^\d{4}-\d{2}-\d{2}/.test(strValue)) {
        type = 'date';
      }
    }

    return { name: header, type, nullable };
  });
}

export async function createDataset(
  userId: string,
  file: Express.Multer.File,
  input: { name: string; description: string },
): Promise<PublicDataset> {
  await ensureUploadsDir();

  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.csv') {
    throw ApiError.badRequest('DATASET_INVALID_FORMAT', 'Only CSV files are supported');
  }

  const dataset = await datasetRepository.create({
    userId,
    name: input.name,
    description: input.description || null,
    filename: file.originalname,
    filePath: file.path,
    fileSize: file.size,
    mimeType: file.mimetype,
  });

  try {
    await datasetRepository.updateStatus(dataset.id, 'processing');

    const tableName = getTableName(dataset.id);
    await duckdbService.registerCsv(tableName, file.path);

    const rowCount = await duckdbService.getRowCount(tableName);
    const columnSchema = await duckdbService.getColumnSchema(tableName);

    await datasetRepository.updateStatus(dataset.id, 'ready', rowCount, columnSchema);

    const updated = await datasetRepository.findById(dataset.id);
    return toPublicDataset(updated!);
  } catch (error) {
    await datasetRepository.updateStatus(dataset.id, 'failed');
    throw error;
  }
}

export async function deleteDataset(
  userId: string,
  datasetId: string,
): Promise<void> {
  const dataset = await datasetRepository.findById(datasetId);

  if (!dataset) {
    throw ApiError.notFound('DATASET_NOT_FOUND', 'Dataset not found');
  }

  if (dataset.user_id !== userId) {
    throw ApiError.forbidden('DATASET_ACCESS_DENIED', 'You do not have access to this dataset');
  }

  const tableName = getTableName(datasetId);
  await duckdbService.dropTable(tableName);

  try {
    await fs.unlink(dataset.file_path);
  } catch {
    // File may already be deleted; continue
  }

  await datasetRepository.deleteById(datasetId);
}

export async function getDatasetData(
  datasetId: string,
  options: { limit: number; offset: number },
): Promise<{ data: Record<string, unknown>[]; total: number }> {
  const dataset = await datasetRepository.findById(datasetId);

  if (!dataset) {
    throw ApiError.notFound('DATASET_NOT_FOUND', 'Dataset not found');
  }

  if (dataset.status !== 'ready') {
    throw ApiError.badRequest('DATASET_NOT_READY', 'Dataset is not ready for querying');
  }

  const tableName = getTableName(datasetId);
  const [data, total] = await Promise.all([
    duckdbService.getData(tableName, options),
    duckdbService.getRowCount(tableName),
  ]);

  return { data, total };
}
