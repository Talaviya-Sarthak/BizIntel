import { logger } from '../config/logger.js';
import type { BackgroundJob, JobStatus, JobType } from './job.types.js';

export class JobQueue {
  private readonly jobs = new Map<string, BackgroundJob>();

  /**
   * Enqueues a new background job.
   */
  public enqueue(type: JobType, payload: Record<string, any>): BackgroundJob {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const job: BackgroundJob = {
      jobId,
      type,
      status: 'queued',
      payload,
      createdAt: now,
      updatedAt: now,
      progressPercent: 0,
    };

    this.jobs.set(jobId, job);
    logger.info({ jobId, type }, 'Background job enqueued');

    // Simulate async execution worker
    setImmediate(() => this.processJob(jobId));

    return job;
  }

  public getJob(jobId: string): BackgroundJob | undefined {
    return this.jobs.get(jobId);
  }

  public listJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values());
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    job.progressPercent = 50;
    job.updatedAt = new Date().toISOString();

    try {
      // Simulate task processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      job.status = 'completed';
      job.progressPercent = 100;
      job.result = { message: `Job ${job.type} processed successfully.` };
      job.updatedAt = new Date().toISOString();
      logger.info({ jobId, type: job.type }, 'Background job completed');
    } catch (error: any) {
      job.status = 'failed';
      job.error = error?.message || 'Job processing failed';
      job.updatedAt = new Date().toISOString();
      logger.error({ err: error, jobId }, 'Background job failed');
    }
  }
}

export const jobQueue = new JobQueue();
