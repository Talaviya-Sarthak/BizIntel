import multer from 'multer';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { MAX_DATASET_SIZE_BYTES } from '../config/env';
import { ApiError } from '../utils/httpError';
import { storageService } from '../services/storage.service';

const SUPPORTED_EXTENSIONS = new Set(['.csv']);

/** MIME hints accepted on the wire — never trusted alone, re-validated later. */
const SUPPORTED_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, storageService.getTempDir()),
    filename: (_req, file, cb) => cb(null, storageService.generateTempFilename(file.originalname)),
  }),
  limits: {
    fileSize: MAX_DATASET_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      cb(ApiError.badRequest('DATASET_INVALID_TYPE', 'Only CSV files are supported'));
      return;
    }
    if (!SUPPORTED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(ApiError.badRequest('DATASET_INVALID_MIME', 'Unsupported file type'));
      return;
    }
    cb(null, true);
  },
});

/**
 * Express middleware that parses the multipart `file` field and normalizes
 * multer failures into the API error contract.
 */
export function uploadDatasetFile(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(
          ApiError.badRequest(
            'DATASET_FILE_TOO_LARGE',
            `File exceeds the maximum allowed size of ${MAX_DATASET_SIZE_BYTES / (1024 * 1024)} MB`,
          ),
        );
        return;
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        next(ApiError.badRequest('DATASET_NO_FILE', 'A single CSV file is required'));
        return;
      }
    }

    next(ApiError.badRequest('DATASET_UPLOAD_FAILED', 'File upload failed'));
  });
}
