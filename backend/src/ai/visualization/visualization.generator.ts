import type { ToolResult } from '../tools/tool.types';
import type { ChartType, VisualizationResult } from './visualization.types';

export class VisualizationService {
  /**
   * Generates a array of VisualizationResult objects from ToolResult data.
   */
  public generateVisualizations(toolResult: ToolResult): VisualizationResult[] {
    if (!toolResult || !toolResult.data) return [];

    const results: VisualizationResult[] = [];
    const data = toolResult.data;

    // 1. Generate Datasets Bar/Line chart if dataset array is present
    if (Array.isArray(data.datasets) && data.datasets.length > 0) {
      const labels = data.datasets.map((d: any) => d.name || 'Dataset');
      const rowCounts = data.datasets.map((d: any) => d.rowCount || 0);

      results.push({
        id: `chart_ds_${Date.now()}`,
        chartType: 'bar',
        title: 'Dataset Volume Distribution',
        description: 'Row counts across active enterprise datasets',
        chartData: {
          labels,
          datasets: [
            {
              label: 'Row Count',
              data: rowCounts,
              backgroundColor: '#6366f1',
            },
          ],
        },
      });
    }

    // 2. Generate Backtests KPI / Strategy Distribution
    if (Array.isArray(data.availableStrategies) && data.availableStrategies.length > 0) {
      results.push({
        id: `chart_strat_${Date.now()}`,
        chartType: 'pie',
        title: 'Trading Strategies Catalog',
        description: 'Distribution of quantitative strategies',
        chartData: {
          labels: data.availableStrategies,
          datasets: [
            {
              label: 'Strategy Type',
              data: data.availableStrategies.map(() => 1),
              backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            },
          ],
        },
      });
    }

    return results;
  }

  /**
   * Explicit helper to build a custom Chart Spec.
   */
  public createCustomChart(
    chartType: ChartType,
    title: string,
    labels: string[],
    dataValues: number[],
    description?: string,
  ): VisualizationResult {
    return {
      id: `chart_custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      chartType,
      title,
      description,
      chartData: {
        labels,
        datasets: [
          {
            label: title,
            data: dataValues,
            backgroundColor: '#6366f1',
          },
        ],
      },
    };
  }
}

export const visualizationService = new VisualizationService();
