import type { Dataset } from '../datasets/types';

/**
 * Dashboard summary. Features that are not yet implemented are `null` so the
 * UI can render an honest "coming soon" state instead of fabricated numbers.
 */
export interface DashboardSummary {
  datasets: {
    total: number;
    byStatus: {
      READY: number;
      FAILED: number;
      PROCESSING: number;
    };
  };
  recentDatasets: Dataset[];
  analysisRuns: null;
  backtests: null;
  aiConversations: null;
}
