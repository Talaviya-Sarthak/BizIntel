import { datamartService } from '../../../datamart/services/datamart.service';
import * as datasetRepository from '../../../repositories/dataset.repository';
import type { IntentCategory } from '../../router/intent.types';
import type { AITool } from '../tool.interface';
import type { ToolContext, ToolResult } from '../tool.types';

export class AnalyticsTool implements AITool {
  public readonly id = 'analytics_tool';
  public readonly name = 'Dataset Intelligence & Analytics Adapter';
  public readonly description = 'Adapts queries to existing dataset and DataMart analytics services.';
  public readonly supportedIntent: IntentCategory = 'analytics';

  public async execute(context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();

    // Invoke existing backend analytics and dataset services without duplicating logic
    const datasets = await datasetRepository.listByUser(context.userId);
    const overview = await datamartService.getOverview(context.userId);

    return {
      success: true,
      toolId: this.id,
      data: {
        totalDatasets: datasets.length,
        datasets: datasets.map((d) => ({
          id: d.id,
          name: d.name,
          rowCount: d.rowCount,
          columnCount: d.columnCount,
          status: d.status,
        })),
        datamartOverview: overview,
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
