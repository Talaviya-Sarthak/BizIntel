import type { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import * as datasetService from '../services/dataset.service';
import type { ListDatasetsInput } from '../validators/dataset.validator';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const options = req.query as unknown as ListDatasetsInput;

  const result = await datasetService.listDatasets(userId, options);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Datasets retrieved successfully',
  });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const id = req.params.id as string;

  const dataset = await datasetService.getDataset(userId, id);

  res.status(200).json({
    success: true,
    data: { dataset },
    message: 'Dataset retrieved successfully',
  });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DATASET_NO_FILE',
        message: 'A CSV file is required',
      },
    });
    return;
  }

  const dataset = await datasetService.createDataset(userId, file, {
    name: req.body.name,
    description: req.body.description,
  });

  res.status(201).json({
    success: true,
    data: { dataset },
    message: 'Dataset created successfully',
  });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.userId;
  const id = req.params.id as string;

  await datasetService.deleteDataset(userId, id);

  res.status(200).json({
    success: true,
    data: null,
    message: 'Dataset deleted successfully',
  });
});

export const getData = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 100, 1000);
  const offset = parseInt(req.query.offset as string, 10) || 0;

  const result = await datasetService.getDatasetData(id, { limit, offset });

  res.status(200).json({
    success: true,
    data: result,
    message: 'Dataset data retrieved successfully',
  });
});
