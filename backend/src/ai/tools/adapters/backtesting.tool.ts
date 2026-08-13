import { backtestRepository } from '../../../backtesting/repositories/backtest.repository';
import { backtestingService } from '../../../backtesting/services/backtesting.service';
import type { IntentCategory } from '../../router/intent.types';
import type { AITool } from '../tool.interface';
import type { ToolContext, ToolResult } from '../tool.types';

export class BacktestingTool implements AITool {
  public readonly id = 'backtesting_tool';
  public readonly name = 'Quantitative Backtesting Engine Adapter';
  public readonly description = 'Adapts queries to existing trading backtest strategy and metrics services.';
  public readonly supportedIntent: IntentCategory = 'backtesting';

  public async execute(context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();

    // Invoke existing backend backtesting service without duplicating code
    const strategies = backtestingService.listStrategies();
    const backtestRuns = await backtestRepository.listByUser(context.userId);

    return {
      success: true,
      toolId: this.id,
      data: {
        availableStrategies: strategies,
        userBacktestCount: backtestRuns.length,
        recentBacktests: backtestRuns.slice(0, 5).map((b) => ({
          id: b.id,
          name: b.name,
          strategyId: b.strategyId,
          status: b.status,
          createdAt: b.createdAt,
        })),
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
