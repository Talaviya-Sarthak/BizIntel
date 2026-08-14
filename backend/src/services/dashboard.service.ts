import { toPublicDataset } from '../models/dataset.model.js';
import * as datasetRepository from '../repositories/dataset.repository.js';

export interface DashboardSummary {
  datasets: {
    total: number;
    byStatus: {
      READY: number;
      FAILED: number;
      PROCESSING: number;
    };
  };
  recentDatasets: ReturnType<typeof toPublicDataset>[];
  /**
   * Modules not yet implemented are `null` so the UI can render an honest
   * "coming soon" state instead of fabricated numbers.
   */
  analysisRuns: null;
  backtests: null;
  aiConversations: null;
}

export const dashboardService = {
  async getSummary(userId: string): Promise<DashboardSummary> {
    const [total, ready, failed, processing, recent] = await Promise.all([
      datasetRepository.countByUser(userId),
      datasetRepository.countByUserAndStatus(userId, 'READY'),
      datasetRepository.countByUserAndStatus(userId, 'FAILED'),
      datasetRepository.countByUserAndStatus(userId, 'PROCESSING'),
      datasetRepository.findRecentByUser(userId, 5),
    ]);

    return {
      datasets: {
        total,
        byStatus: {
          READY: ready,
          FAILED: failed,
          PROCESSING: processing,
        },
      },
      recentDatasets: recent.map(toPublicDataset),
      analysisRuns: null,
      backtests: null,
      aiConversations: null,
    };
  },
};
