import { beforeEach, describe, expect, test } from 'vitest';
import { jobQueue, JobQueue } from '../job.queue.js';

describe('Phase 8: Background Job Queue Unit Tests', () => {
  let queue: JobQueue;

  beforeEach(() => {
    queue = new JobQueue();
  });

  test('1. Enqueue job returns queued BackgroundJob record', () => {
    const job = queue.enqueue('document_indexing', { documentId: 'doc_1' });
    expect(job).toBeDefined();
    expect(job.jobId).toBeDefined();
    expect(job.type).toBe('document_indexing');
  });

  test('2. Retrieve job by ID', () => {
    const enqueued = queue.enqueue('report_export', { format: 'pdf' });
    const retrieved = queue.getJob(enqueued.jobId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.jobId).toBe(enqueued.jobId);
  });

  test('3. Singleton jobQueue exists', () => {
    expect(jobQueue).toBeDefined();
  });
});
