import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';
import { ApiError } from '../utils/httpError';

/**
 * Raised when uploaded file *content* fails validation. The message is a
 * clean, user-facing reason (no stack traces). Such failures mark the dataset
 * as FAILED in the registry so the user can see why.
 */
export class DatasetValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatasetValidationError';
  }
}

export interface HeaderResult {
  /** Header column names, trimmed and BOM-stripped. */
  columns: string[];
}

/**
 * Validates uploaded CSV files. Checks here are cheap client-facing checks
 * (extension, size, header) while heavy parsing (row counts, schema, types,
 * nulls) is delegated to DuckDB.
 */
export const validationService = {
  /**
   * Client-error checks that reject the request before any dataset row is
   * created. MIME type is only used as a hint and never trusted alone.
   * Returns the file when valid so callers can rely on its presence.
   */
  assertUploadFile(
    file: Express.Multer.File | undefined,
    maxBytes: number,
  ): Express.Multer.File {
    if (!file) {
      throw ApiError.badRequest('DATASET_NO_FILE', 'A CSV file is required');
    }
    if (file.size === 0) {
      throw ApiError.badRequest(
        'DATASET_EMPTY_FILE',
        'The file is empty. Upload a CSV with at least a header row.',
      );
    }
    if (file.size > maxBytes) {
      throw ApiError.badRequest(
        'DATASET_FILE_TOO_LARGE',
        `File exceeds the maximum allowed size of ${Math.round(maxBytes / (1024 * 1024))} MB`,
      );
    }
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      throw ApiError.badRequest('DATASET_INVALID_TYPE', 'Only CSV files are supported');
    }
    return file;
  },

  /**
   * Reads and validates the CSV header row. Returns normalized column names.
   * Throws `DatasetValidationError` with a clean reason when the header is
   * missing, empty, or contains duplicates.
   */
  async readHeader(filePath: string): Promise<HeaderResult> {
    const record = await readFirstRecord(filePath);

    if (record.length === 0) {
      throw new DatasetValidationError('The file does not contain a header row');
    }

    const columns: string[] = record.map((cell, index) => {
      const name = (cell ?? '').trim();
      if (!name) {
        throw new DatasetValidationError(`Empty column name at position ${index + 1}`);
      }
      return name;
    });

    const seen = new Set<string>();
    for (const name of columns) {
      const key = name.toLowerCase();
      if (seen.has(key)) {
        throw new DatasetValidationError(`Duplicate column name detected: ${name}`);
      }
      seen.add(key);
    }

    return { columns };
  },
};

/** Reads only the first CSV record (the header) using a bounded stream. */
function readFirstRecord(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const records: string[][] = [];

    const parser = fs
      .createReadStream(filePath, { highWaterMark: 256 * 1024 })
      .pipe(parse({ bom: true }));

    parser.on('data', (record: string[]) => {
      if (records.length === 0) {
        records.push(record);
        parser.destroy();
      }
    });
    parser.on('error', (error: Error) => {
      reject(
        new DatasetValidationError(`The file could not be read as CSV: ${error.message}`),
      );
    });
    parser.on('close', () => resolve(records[0] ?? []));
  });
}
