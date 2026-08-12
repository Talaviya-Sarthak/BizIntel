import { toPublicDataset, type PublicDataset } from '../models/dataset.model';
import * as datasetRepository from '../repositories/dataset.repository';
import * as datasetColumnRepository from '../repositories/datasetColumn.repository';
import { ApiError } from '../utils/httpError';
import { duckdbService } from './duckdb.service';
import { storageService } from './storage.service';
import { DatasetValidationError, validationService } from './validation.service';

export interface CreateUploadInput {
  userId: string;
  tmpPath: string;
  originalFilename: string;
  fileSize: number;
  name?: string;
  description?: string | null;
}

/**
 * Orchestrates the dataset lifecycle. The HTTP layer stays thin; all
 * processing (validation → DuckDB → storage → metadata) happens here and is
 * structured so a job queue can be introduced later without touching routes.
 */
export const datasetService = {
  /**
   * Persists upload metadata, runs the processing pipeline and returns the
   * final dataset state (READY or FAILED with a clean error message).
   */
  async createFromUpload(input: CreateUploadInput): Promise<PublicDataset> {
    const name = (input.name ?? '').trim() || nameFromFilename(input.originalFilename);
    const description = (input.description ?? '').trim() || null;

    const dataset = await datasetRepository.create({
      userId: input.userId,
      name,
      description,
      originalFilename: input.originalFilename,
      fileType: 'csv',
      fileSize: input.fileSize,
    });

    await this.runPipeline({
      datasetId: dataset.id,
      userId: dataset.userId,
      tmpPath: input.tmpPath,
    });

    const final = await datasetRepository.findByIdAndUser(dataset.id, dataset.userId);
    return toPublicDataset(final!);
  },

  /**
   * Runs the upload pipeline for an existing (UPLOADING) dataset row.
   * All failures are captured into the dataset's `error_message` and the row
   * transitions to FAILED — never to an unhandled 500.
   */
  async runPipeline(input: { datasetId: string; userId: string; tmpPath: string }): Promise<void> {
    let storageKey: string | null = null;
    try {
      await datasetRepository.updateStatus(input.datasetId, 'VALIDATING');

      // Move the file into permanent storage BEFORE DuckDB opens it. On Windows
      // DuckDB keeps the file handle alive for seconds after `db.close()`,
      // which would make a later rename fail with EBUSY.
      storageKey = await storageService.persist(input.tmpPath, input.userId, input.datasetId);
      const storagePath = storageService.absolutePath(storageKey);

      await validationService.readHeader(storagePath);

      await datasetRepository.updateStatus(input.datasetId, 'PROCESSING');
      const analysis = await duckdbService.inspectCsv(storagePath);

      if (analysis.columns.length === 0) {
        throw new DatasetValidationError('The file does not contain any columns');
      }
      if (analysis.rowCount === 0) {
        throw new DatasetValidationError('The file contains a header but no data rows');
      }

      await datasetRepository.updateStorage(input.datasetId, storageKey);

      await datasetColumnRepository.createMany(
        analysis.columns.map((column, index) => ({
          datasetId: input.datasetId,
          columnName: column.name,
          dataType: column.type,
          nullable: column.nullCount > 0,
          ordinalPosition: index + 1,
          uniqueCount: column.uniqueCount,
          nullCount: column.nullCount,
        })),
      );

      await datasetRepository.updateMetadata(input.datasetId, {
        rowCount: analysis.rowCount,
        columnCount: analysis.columns.length,
      });
      await datasetRepository.updateStatus(input.datasetId, 'READY');
    } catch (error) {
      // The file may already have been moved into storage; remove it wherever
      // it lives so a FAILED dataset never leaves an orphaned file behind.
      if (storageKey) {
        await storageService.delete(storageKey);
      }
      await storageService.removeTemp(input.tmpPath);
      await datasetRepository.updateStatus(
        input.datasetId,
        'FAILED',
        toDatasetErrorMessage(error),
      );
    }
  },

  /**
   * Deletes a dataset owned by the user: removes the PostgreSQL row (columns
   * cascade) and then best-effort deletes the stored file to avoid orphans.
   */
  async deleteForUser(datasetId: string, userId: string): Promise<void> {
    const dataset = await datasetRepository.findByIdAndUser(datasetId, userId);
    if (!dataset) {
      throw ApiError.notFound('DATASET_NOT_FOUND', 'Dataset not found');
    }

    await datasetRepository.deleteById(datasetId);

    if (dataset.storagePath) {
      await storageService.delete(dataset.storagePath);
    }
  },
};

function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return base || 'Untitled dataset';
}

/** Builds a clean, user-facing failure reason (no stack traces, no internals). */
function toDatasetErrorMessage(error: unknown): string {
  if (error instanceof DatasetValidationError) {
    return error.message;
  }
  if (error instanceof Error) {
    const message = error.message
      .split('\n')[0]
      ?.replace(/^Error:\s*/i, '')
      .replace(/^.*error:\s*/i, '')
      .trim();
    if (message) return message.slice(0, 300);
  }
  return 'The dataset could not be processed';
}
