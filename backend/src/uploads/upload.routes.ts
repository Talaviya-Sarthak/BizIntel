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

    const contentBuffer = Buffer.isBuffer(content)
      ? content
      : typeof content === 'string' && content.startsWith('data:')
        ? Buffer.from(content.split(',')[1] || '', 'base64')
        : typeof content === 'string' && /^[A-Za-z0-9+/=\s]+$/.test(content.trim().substring(0, 100))
          ? Buffer.from(content.trim(), 'base64')
          : Buffer.from(content);

    console.log('\n==================================================');
    console.log('STEP 1: UPLOAD ENDPOINT TELEMETRY');
    console.log(`File Name: "${filename}"`);
    console.log(`MIME / File Type Hint: "${fileType || 'pdf'}"`);
    console.log(`Content Size: ${typeof content === 'string' ? content.length : content.length} chars/bytes`);
    console.log(`Decoded Buffer Length: ${contentBuffer.length} bytes`);
    console.log('==================================================\n');

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
