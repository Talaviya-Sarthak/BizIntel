import type { IntentCategory } from '../../router/intent.types';
import type { AITool } from '../tool.interface';
import type { ToolContext, ToolResult } from '../tool.types';

export class GeneralTool implements AITool {
  public readonly id = 'general_tool';
  public readonly name = 'General Conversational Adapter';
  public readonly description = 'Handles general greetings and platform overview queries.';
  public readonly supportedIntent: IntentCategory = 'general';

  public async execute(context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();

    return {
      success: true,
      toolId: this.id,
      data: {
        query: context.query,
        capabilities: [
          'Enterprise DataMart SQL Analytics & Schema Profiling',
          'Quantitative Trading Strategy Backtesting',
          'Knowledge Base RAG Document Intelligence',
          'Retail Catalog Search',
        ],
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
