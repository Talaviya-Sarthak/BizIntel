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
        response: 'Hello! I am your Enterprise Intelligence Assistant. How can I assist you with analytics, backtesting, or retail data today?',
        query: context.query,
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
