import { env } from '../config/env';
import { ApiError } from '../utils/httpError';
import { responseGenerator } from './generator/response.generator';
import type { AIResponse } from './generator/response.types';
import { memoryManager } from './memory/memory.manager';
import { aiOrchestrator } from './orchestrator/orchestrator';
import { intentRouter } from './router/router';
import { initializeDefaultTools } from './tools/tool.factory';
import { toolRegistry } from './tools/tool.registry';
import type { ToolContext } from './tools/tool.types';

export interface AIServiceChatResult {
  sessionId: string;
  response: AIResponse;
}

export class AIService {
  constructor() {
    // Ensure default tool adapters are registered on service instantiation
    initializeDefaultTools(toolRegistry);
  }

  /**
   * Process a multi-turn conversation query through the full AI Pipeline with stateful Memory:
   * 1. Session Init / Retrieval
   * 2. Save User Message
   * 3. Intent Router Classification
   * 4. AI Orchestrator Execution Plan
   * 5. Tool Registry Adapter Execution
   * 6. Save Tool Result in Session
   * 7. Build MemoryContext (Summary + Chat History + Tool Results)
   * 8. Response Generator LLM Synthesis
   * 9. Save Assistant Response
   * 10. Auto-Summarize & Trim
   *
   * @param message User query string
   * @param userId User UUID requesting the operation
   * @param sessionId Optional session identifier for multi-turn conversations
   * @returns AIServiceChatResult carrying sessionId and generated AIResponse
   */
  public async chat(
    message: string,
    userId: string = 'guest-system-user',
    sessionId?: string,
  ): Promise<AIServiceChatResult> {
    const apiKey = env.GROQ_API_KEY;

    if (!apiKey) {
      throw ApiError.unauthorized(
        'AI_API_KEY_MISSING',
        'Groq API key is not configured on the server. Please set GROQ_API_KEY in environment variables.',
      );
    }

    // 1. Retrieve or create session
    const session = memoryManager.getOrCreateSession(sessionId, userId);

    // 2. Save User Message
    memoryManager.saveUserMessage(session.sessionId, message);

    // 3. Classify Intent
    const intentResult = await intentRouter.classify(message);

    // 4. Generate Execution Plan
    const executionPlan = aiOrchestrator.plan(intentResult);

    // 5. Execute Tool Adapter
    const context: ToolContext = {
      query: message,
      userId,
      sessionId: session.sessionId,
      executionPlan,
    };
    const toolResult = await toolRegistry.execute(executionPlan.selectedTool, context);

    // 6. Save Tool Result into Memory
    memoryManager.saveToolResult(session.sessionId, toolResult);

    // 7. Build Memory Context
    const memoryContext = memoryManager.buildContext(
      session.sessionId,
      message,
      executionPlan,
      toolResult,
    );

    // 8. Generate Final Response with Memory Context Injection
    const response = await responseGenerator.generate({
      userQuestion: message,
      executionPlan,
      toolResult,
      memoryContext,
    });

    // 9. Save Assistant Response into Memory
    memoryManager.saveAssistantMessage(session.sessionId, response.answer);

    // 10. Asynchronously check summarization & trim conversation history
    void memoryManager.summarizeConversation(session.sessionId);
    memoryManager.trimConversation(session.sessionId);

    return {
      sessionId: session.sessionId,
      response,
    };
  }
}

export const aiService = new AIService();
