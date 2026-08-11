import type { Request, Response } from 'express';
import { MAX_DATASET_SIZE_BYTES } from '../config/env';
import { toPublicDataset } from '../models/dataset.model';
import * as datasetRepository from '../repositories/dataset.repository';
import * as datasetColumnRepository from '../repositories/datasetColumn.repository';
import { datasetService } from '../services/dataset.service';
import { duckdbService } from '../services/duckdb.service';
import { storageService, sanitizeFilename } from '../services/storage.service';
import { validationService } from '../services/validation.service';
import { ApiError } from '../utils/httpError';
import { asyncHandler } from '../utils/asyncHandler';
import type { DatasetPreviewQuery, DatasetUploadInput } from '../validators/dataset.validator';

export const listDatasets = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;

  const [datasets, total] = await Promise.all([
    datasetRepository.listByUser(userId),
    datasetRepository.countByUser(userId),
  ]);

  res.status(200).json({
    success: true,
    data: {
      datasets: datasets.map(toPublicDataset),
      total,
    },
  });
});

export const createDataset = asyncHandler(async (req: Request, res: Response) => {
  let file: Express.Multer.File;

  try {
    file = validationService.assertUploadFile(req.file, MAX_DATASET_SIZE_BYTES);
  } catch (error) {
    if (req.file) await storageService.removeTemp(req.file.path);
    throw error;
  }

  const body = (req.body ?? {}) as DatasetUploadInput;

  const dataset = await datasetService.createFromUpload({
    userId: req.auth!.userId,
    tmpPath: file.path,
    originalFilename: file.originalname,
    fileSize: file.size,
    name: body.name || undefined,
    description: body.description || undefined,
  });

  res.status(201).json({
    success: true,
    data: { dataset },
    message:
      dataset.status === 'READY'
        ? 'Dataset uploaded and processed'
        : 'Dataset upload did not complete successfully',
  });
});

export const getDataset = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);

  res.status(200).json({
    success: true,
    data: {
      dataset: toPublicDataset(dataset),
      columns,
    },
  });
});

export const getDatasetSchema = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const columns = await datasetColumnRepository.listByDatasetId(dataset.id);

  res.status(200).json({
    success: true,
    data: { schema: columns },
  });
});

export const getDatasetPreview = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;
  const query = (req.query ?? {}) as DatasetPreviewQuery;
  const limit = query.limit ?? 20;

  if (dataset.status !== 'READY' || !dataset.storagePath) {
    throw ApiError.conflict(
      'DATASET_NOT_READY',
      'This dataset is not ready for preview yet',
    );
  }

  const storagePath = dataset.storagePath;

  const rows = await duckdbService.previewCsv(
    storageService.absolutePath(storagePath),
    limit,
  );

  res.status(200).json({
    success: true,
    data: {
      preview: rows,
      limit,
      truncated: rows.length >= limit,
    },
  });
});

export const downloadDataset = asyncHandler(async (req: Request, res: Response) => {
  const dataset = req.dataset!;

  if (!dataset.storagePath) {
    throw ApiError.conflict(
      'DATASET_NOT_READY',
      'This dataset has no stored file to download',
    );
  }

  const stream = storageService.createReadStream(dataset.storagePath);
  const filename = sanitizeFilename(dataset.originalFilename);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', String(dataset.fileSize));

  stream.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: { code: 'DOWNLOAD_FAILED', message: 'Could not stream the dataset file' },
      });
    }
  });
  stream.pipe(res);
});

export const deleteDataset = asyncHandler(async (req: Request, res: Response) => {  const { id } = req.params;
  if (!id) {
    throw ApiError.badRequest('INVALID_DATASET_ID', 'Invalid dataset id');
  }

  await datasetService.deleteForUser(id, req.auth!.userId);

  res.status(200).json({
    success: true,
    data: { id },
    message: 'Dataset deleted',
  });
});
