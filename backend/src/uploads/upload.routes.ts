import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/httpError';
import { uploadService } from './upload.service';

const router = Router();

/**
 * POST /api/v1/uploads/ingest
 * Ingest document file directly into RAG Vector Store
 */
router.post(
  '/ingest',
  asyncHandler(async (req, res) => {
    const { filename, content, fileType } = req.body;

    if (!filename || !content) {
      throw ApiError.badRequest('MISSING_UPLOAD_DATA', 'filename and content parameters are required.');
    }

    const result = await uploadService.processUpload(filename, content, fileType);
    res.status(201).json(result);
  }),
);

/**
 * GET /api/v1/uploads
 * List all ingested uploaded files
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const uploads = uploadService.listUploads();
    res.status(200).json({ success: true, uploads });
  }),
);

export default router;
