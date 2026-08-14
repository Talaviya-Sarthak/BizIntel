import { Router } from 'express';
import { memoryManager } from '../../ai/memory/memory.manager.js';
import { knowledgeVectorStore } from '../../ai/knowledge/knowledge.vectorstore.js';
import { jobQueue } from '../../jobs/job.queue.js';
import { uploadService } from '../../uploads/upload.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

/**
 * GET /api/v1/system/health
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.status(200).json({
      status: 'UP',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        aiPipeline: 'HEALTHY',
        vectorStore: 'HEALTHY',
        memoryManager: 'HEALTHY',
        jobQueue: 'HEALTHY',
      },
    });
  }),
);

/**
 * GET /api/v1/system/metrics
 */
router.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    const memoryStats = memoryManager.getStats();
    const vectorStats = knowledgeVectorStore.stats();
    const jobs = jobQueue.listJobs();
    const uploads = await uploadService.listUploads();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      processMemory: process.memoryUsage(),
      metrics: {
        memorySessions: memoryStats.totalSessions,
        memoryMessages: memoryStats.totalMessages,
        vectorStoreChunks: vectorStats.totalChunks,
        vectorStoreDocuments: vectorStats.totalDocuments,
        activeJobsCount: jobs.length,
        uploadedFilesCount: uploads.length,
      },
    });
  }),
);

export default router;
