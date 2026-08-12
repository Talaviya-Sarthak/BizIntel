/**
 * Background Job Queue Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type JobType = 'embedding_generation' | 'document_indexing' | 'report_export' | 'cache_cleanup';

export interface BackgroundJob {
  jobId: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, any>;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  progressPercent: number;
}
