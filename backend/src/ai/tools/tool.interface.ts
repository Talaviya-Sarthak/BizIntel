import type { IntentCategory } from '../router/intent.types.js';
import type { ToolContext, ToolResult } from './tool.types.js';

/**
 * Contract that every AI Tool adapter must implement.
 */
export interface AITool {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly supportedIntent: IntentCategory;

  /**
   * Execute the tool adapter logic using existing backend services.
   *
   * @param context Tool execution context carrying query, user info, and plan
   * @returns Standardized ToolResult payload
   */
  execute(context: ToolContext): Promise<ToolResult>;
}
