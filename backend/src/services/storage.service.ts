import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { env } from '../config/env';
import { DATAMART_BUCKET, getSupabaseAdminClient } from '../config/supabase';
import { logger } from '../config/logger';

/**
 * DataMart storage abstraction backed by Supabase Storage.
 *
 * The complete CSV file is stored as ONE object per dataset in the
 * `datamart-datasets` bucket (never row-by-row in PostgreSQL). PostgreSQL
 * only stores dataset metadata + schema; DuckDB reads the CSV for analytics.
 *
 * Because DuckDB needs a local file, `acquireLocalPath()` downloads the
 * object into a scratch cache directory. The local copy is a cache only —
 * the object in Supabase Storage is the single source of truth.
 */
export interface PersistResult {
  /** Opaque storage key (e.g. `{userId}/{datasetId}.csv`). */
  key: string;
  /** SHA-256 hex digest of the uploaded file bytes. */
  checksum: string;
}

export interface StorageService {
  /** Directory used for in-progress multipart uploads. */
  getTempDir(): string;
  /**
   * Uploads a CSV from the multer temp file into Supabase Storage at
   * `datamart-datasets/{userId}/{datasetId}.csv`. Removes the temp file and
   * returns the storage key plus the computed SHA-256 checksum.
   */
  persist(sourcePath: string, userId: string, datasetId: string): Promise<PersistResult>;
  /** Deletes the stored object. Resolves silently if it is already gone. */
  delete(key: string): Promise<void>;
  /** Deletes a temp file left over from a failed upload. */
  removeTemp(sourcePath: string): Promise<void>;
  /** Opens a read stream over the stored object (for downloads). */
  createReadStream(key: string): Promise<Readable>;
  /** The DataMart bucket name the CSV objects live in. */
  bucket(): string;
  /**
   * Downloads the object into a local scratch cache and returns the local
   * path so DuckDB can read the CSV. Cached per key; no-op when already
   * cached.
   */
  acquireLocalPath(key: string): Promise<string>;
  /** Removes the local scratch-cache copy of an object (must be best effort). */
  releaseLocalPath(key: string): Promise<void>;
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

class SupabaseStorageService implements StorageService {
  private readonly tempDir: string;
  /** Local scratch cache directory DuckDB reads from (canonical copy is in Supabase). */
  private readonly cacheDir: string;

  constructor() {
    const root = path.isAbsolute(env.DATASET_STORAGE_PATH)
      ? env.DATASET_STORAGE_PATH
      : path.resolve(process.cwd(), env.DATASET_STORAGE_PATH);
    this.tempDir = path.join(root, 'tmp');
    this.cacheDir = path.join(root, 'cache');

    fs.mkdirSync(this.tempDir, { recursive: true });
    fs.mkdirSync(this.cacheDir, { recursive: true });
    logger.info(
      { bucket: DATAMART_BUCKET, tempDir: this.tempDir, cacheDir: this.cacheDir },
      'Supabase DataMart storage initialized (local temp/cache atop Supabase Storage)',
    );
  }

  getTempDir(): string {
    return this.tempDir;
  }

  bucket(): string {
    return DATAMART_BUCKET;
  }

  async persist(sourcePath: string, userId: string, datasetId: string): Promise<PersistResult> {
    const key = buildStorageKey(userId, datasetId);

    const buffer = await fs.promises.readFile(sourcePath);
    const checksum = sha256(buffer);

    const { error } = await getSupabaseAdminClient().storage
      .from(DATAMART_BUCKET)
      .upload(key, buffer, {
        contentType: 'text/csv',
        upsert: true,
        cacheControl: '3600',
      });
    if (error) {
      throw new Error(`Failed to upload dataset to Supabase Storage: ${error.message}`);
    }

    // The temp file is no longer needed — Supabase is now the source of truth.
    await this.removeTemp(sourcePath);

    logger.info({ key, bucket: DATAMART_BUCKET }, 'Dataset CSV uploaded to Supabase Storage');
    return { key, checksum };
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await getSupabaseAdminClient().storage
        .from(DATAMART_BUCKET)
        .remove([key]);
      if (error) {
        logger.warn({ key, err: error }, 'Failed to delete dataset object from Supabase Storage');
      } else {
        logger.info({ key, bucket: DATAMART_BUCKET }, 'Dataset object deleted from Supabase Storage');
      }
    } catch (error) {
      logger.warn({ key, err: error }, 'Error while deleting dataset object from Supabase Storage');
    }
    await this.releaseLocalPath(key);
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

  async createReadStream(key: string): Promise<Readable> {
    const { data, error } = await getSupabaseAdminClient().storage
      .from(DATAMART_BUCKET)
      .download(key);
    if (error) {
      throw new Error(`Failed to download dataset from Supabase Storage: ${error.message}`);
    }
    return Readable.from(Buffer.from(await data.arrayBuffer()));
  }

  async acquireLocalPath(key: string): Promise<string> {
    const local = this.cachedPath(key);
    fs.mkdirSync(path.dirname(local), { recursive: true });

    if (fs.existsSync(local)) {
      return local;
    }

    const { data, error } = await getSupabaseAdminClient().storage
      .from(DATAMART_BUCKET)
      .download(key);
    if (error) {
      throw new Error(`Failed to fetch dataset CSV from Supabase Storage: ${error.message}`);
    }

    await fs.promises.writeFile(local, Buffer.from(await data.arrayBuffer()));
    return local;
  }

  async releaseLocalPath(key: string): Promise<void> {
    const local = this.cachedPath(key);
    try {
      await fs.promises.unlink(local);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn({ key, err: error }, 'Failed to remove local dataset cache file');
      }
    }
  }

  generateTempFilename(originalName: string): string {
    const safe = sanitizeFilename(originalName);
    const ext = path.extname(safe) || '.csv';
    const stem = path.basename(safe, ext);
    const nonce = crypto.randomBytes(8).toString('hex');
    return `${stem}-${nonce}${ext}`;
  }

  private cachedPath(key: string): string {
    // Keys are generated internally (`userId/datasetId.csv`) and must not
    // escape the cache root.
    const resolved = path.resolve(this.cacheDir, key);
    if (!resolved.startsWith(path.resolve(this.cacheDir) + path.sep)) {
      throw new Error('Refusing to resolve storage key outside the cache root');
    }
    return resolved;
  }
}

/** Application-wide DataMart storage service instance. */
export const storageService: StorageService = new SupabaseStorageService();

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Unlinks a file, retrying while DuckDB's released handle lingers on Windows.
 */
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

const RENAME_RETRY_MS = 2_000;
const RENAME_INTERVAL_MS = 50;