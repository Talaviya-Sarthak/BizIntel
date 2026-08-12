import { env } from '../config/env';
import { ApiError } from '../utils/httpError';
import { aiOrchestrator } from './orchestrator/orchestrator';
import type { ExecutionPlan } from './orchestrator/pipeline.types';
import { intentRouter } from './router/router';
import { initializeDefaultTools } from './tools/tool.factory';
import { toolRegistry } from './tools/tool.registry';
import type { ToolContext, ToolResult } from './tools/tool.types';

export interface AIServiceChatOutput {
  result: ToolResult;
  plan: ExecutionPlan;
}

export class AIService {
  constructor() {
    // Ensure default tool adapters are registered on service instantiation
    initializeDefaultTools(toolRegistry);
  }

  /**
   * Process a user query through the full AI Router -> AI Orchestrator -> Tool Execution flow.
   *
   * Flow: User -> Intent Router -> AI Orchestrator -> Tool Registry -> Execute Tool Adapter -> ToolResult
   *
   * @param message User query string
   * @param userId User UUID requesting the tool execution
   * @returns AIServiceChatOutput carrying ToolResult and ExecutionPlan
   */
  public async chat(message: string, userId: string = 'guest-system-user'): Promise<AIServiceChatOutput> {
    const apiKey = env.GROQ_API_KEY;

    if (!apiKey) {
      throw ApiError.unauthorized(
        'AI_API_KEY_MISSING',
        'Groq API key is not configured on the server. Please set GROQ_API_KEY in environment variables.',
      );
    }

    // 1. Classify Intent
    const intentResult = await intentRouter.classify(message);

    // 2. Generate Execution Plan
    const executionPlan = aiOrchestrator.plan(intentResult);

    // 3. Assemble Tool Context
    const context: ToolContext = {
      query: message,
      userId,
      executionPlan,
    };

    // 4. Execute Selected Tool Adapter
    const result = await toolRegistry.execute(executionPlan.selectedTool, context);

    return {
      result,
      plan: executionPlan,
    };
  }
}

export const aiService = new AIService();
