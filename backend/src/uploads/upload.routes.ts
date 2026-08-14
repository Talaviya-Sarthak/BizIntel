import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/httpError.js';
import { uploadService } from './upload.service.js';

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

    const isBinaryFormat = fileType === 'pdf' || fileType === 'docx' || fileType === 'xlsx';
    const contentBuffer = Buffer.isBuffer(content)
      ? content
      : typeof content === 'string' && content.startsWith('data:')
        ? Buffer.from(content.split(',')[1] || '', 'base64')
        : typeof content === 'string' && isBinaryFormat && /^[A-Za-z0-9+/=\s]+$/.test(content.trim().substring(0, 100))
          ? Buffer.from(content.trim(), 'base64')
          : Buffer.from(typeof content === 'string' ? content : String(content), 'utf-8');

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
 * List all permanently stored uploaded files from Supabase pgvector
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const uploads = await uploadService.listUploads();
    res.status(200).json({ success: true, uploads });
  }),
);

/**
 * DELETE /api/v1/uploads/:id
 * Permanently delete document metadata, chunks, and embeddings from Supabase
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const fileId = req.params.id;
    if (!fileId) {
      throw ApiError.badRequest('MISSING_FILE_ID', 'File ID parameter is required.');
    }
    await uploadService.deleteUpload(fileId);
    res.status(200).json({ success: true, message: `Document successfully deleted from Supabase RAG store.` });
  }),
);

export default router;
