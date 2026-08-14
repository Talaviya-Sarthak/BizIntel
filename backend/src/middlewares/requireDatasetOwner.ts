import type { RequestHandler } from 'express';
import * as datasetRepository from '../repositories/dataset.repository.js';
import { ApiError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Ownership guard for dataset routes. Must be mounted after `authenticate`.
 *
 * Resolves `:id`, verifies the dataset exists AND belongs to the current user,
 * then attaches `req.dataset`. A missing or foreign dataset returns the same
 * 404 so the existence of other users' resources is never leaked.
 */
export const requireDatasetOwner: RequestHandler = asyncHandler(
  async (req, _res, next) => {
    const { id } = req.params;

    if (typeof id !== 'string' || id.length === 0) {
      return next(ApiError.badRequest('INVALID_DATASET_ID', 'Invalid dataset id'));
    }

    const dataset = await datasetRepository.findById(id);

    if (!dataset || dataset.userId !== req.auth!.userId) {
      return next(ApiError.notFound('DATASET_NOT_FOUND', 'Dataset not found'));
    }

    req.dataset = dataset;
    next();
  },
);
