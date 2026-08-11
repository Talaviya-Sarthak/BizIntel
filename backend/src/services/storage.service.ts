import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Storage abstraction for dataset files.
 *
 * The rest of the application only ever works with opaque storage *keys*
 * (e.g. `a1b2c3/78de/..sales.csv`). This local filesystem implementation can
 * be swapped for an object store (AWS S3, Cloudflare R2, Azure Blob) without
 * touching dataset business logic.
 */
export interface StorageService {
  /** Directory used for in-progress multipart uploads. */
  getTempDir(): string;
  /**
   * Moves an uploaded file from the temp directory into persistent storage.
   * Returns the opaque storage key that must be persisted in PostgreSQL.
   */
  persist(sourcePath: string, userId: string, datasetId: string): Promise<string>;
  /** Deletes a stored file. Resolves silently if it is already gone. */
  delete(key: string): Promise<void>;
  /** Deletes a temp file left over from a failed upload. */
  removeTemp(sourcePath: string): Promise<void>;
  /** Opens a read stream over a stored file (for downloads). */
  createReadStream(key: string): Readable;
  /** Absolute filesystem path for internal use (e.g. DuckDB reads). */
  absolutePath(key: string): string;
  /** Builds a safe temporary filename for a multipart upload. */
  generateTempFilename(originalName: string): string;
}

/** Sanitizes an original filename so it can never traverse or escape storage. */
export function sanitizeFilename(name: string): string {
  const base = path.basename(name)
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim();

  if (base === '' || base === '.' || base === '..') return 'dataset';
  return base;
}

/** Creates a storage key that is safe for both local paths and object stores. */
export function buildStorageKey(userId: string, datasetId: string): string {
  return `${userId}/${datasetId}.csv`;
}

class LocalStorageService implements StorageService {
  private readonly root: string;
  private readonly tempDir: string;

  constructor() {
    // Resolve relative to the backend working directory. DATASET_STORAGE_PATH
    // is configurable via environment variables.
    this.root = path.isAbsolute(env.DATASET_STORAGE_PATH)
      ? env.DATASET_STORAGE_PATH
      : path.resolve(process.cwd(), env.DATASET_STORAGE_PATH);
    this.tempDir = path.join(this.root, 'tmp');

    fs.mkdirSync(this.tempDir, { recursive: true });
    logger.info({ root: this.root }, 'Dataset storage initialized');
  }

  getTempDir(): string {
    return this.tempDir;
  }

  async persist(sourcePath: string, userId: string, datasetId: string): Promise<string> {
    const key = buildStorageKey(userId, datasetId);
    const destination = this.absolutePath(key);

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    await renameWithRetry(sourcePath, destination);
    return key;
  }

  async delete(key: string): Promise<void> {
    try {
      await unlinkWithRetry(this.absolutePath(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn({ key, err: error }, 'Failed to delete stored dataset file');
      }
    }
  }

  async removeTemp(sourcePath: string): Promise<void> {
    try {
      await unlinkWithRetry(sourcePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn({ sourcePath, err: error }, 'Failed to remove temp upload');
      }
    }
  }

  createReadStream(key: string): Readable {
    return fs.createReadStream(this.absolutePath(key));
  }

  absolutePath(key: string): string {
    // The key is generated internally and must not escape the storage root.
    const resolved = path.resolve(this.root, key);
    if (!resolved.startsWith(path.resolve(this.root) + path.sep)) {
      throw new Error('Refusing to resolve storage key outside the storage root');
    }
    return resolved;
  }

  generateTempFilename(originalName: string): string {
    const safe = sanitizeFilename(originalName);
    const ext = path.extname(safe) || '.csv';
    const stem = path.basename(safe, ext);
    const nonce = crypto.randomBytes(8).toString('hex');
    return `${stem}-${nonce}${ext}`;
  }
}

/** Application-wide storage service instance. */
export const storageService: StorageService = new LocalStorageService();

const RENAME_RETRY_MS = 2_000;
const RENAME_INTERVAL_MS = 50;

/**
 * Moves a file, retrying on Windows EBUSY/EPERM. DuckDB's native library can
 * hold a read handle on the source file briefly after `db.close()` resolves,
 * which makes `fs.rename` fail with `EBUSY: resource busy or locked`.
 */
async function renameWithRetry(sourcePath: string, destination: string): Promise<void> {
  const deadline = Date.now() + RENAME_RETRY_MS;
  for (;;) {
    try {
      await fs.promises.rename(sourcePath, destination);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EBUSY' && code !== 'EPERM') throw error;
      if (Date.now() >= deadline) {
        logger.warn({ sourcePath, destination }, 'Timed out waiting to move dataset file');
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RENAME_INTERVAL_MS));
    }
  }
}

/** Unlinks a file, retrying while DuckDB's released handle lingers on Windows. */
async function unlinkWithRetry(filePath: string): Promise<void> {
  const deadline = Date.now() + RENAME_RETRY_MS;
  for (;;) {
    try {
      await fs.promises.unlink(filePath);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EBUSY' && code !== 'EPERM') throw error;
      if (Date.now() >= deadline) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RENAME_INTERVAL_MS));
    }
  }
}
