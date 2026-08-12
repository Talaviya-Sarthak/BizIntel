import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import {
  RESPONSE_GENERATOR_MAX_TOKENS,
  RESPONSE_GENERATOR_MODEL,
  RESPONSE_GENERATOR_TEMPERATURE,
} from './response.constants';
import { RESPONSE_GENERATION_SYSTEM_PROMPT } from './response.prompts';
import type { AIResponse, ResponseContext } from './response.types';
import {
  buildResponseMetadata,
  formatGeneratorPromptInput,
  generateFallbackAnswer,
} from './response.utils';

export class ResponseGenerator {
  private model: ChatGroq | null = null;

  constructor() {
    this.initModel();
  }

  private initModel(): void {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) return;

    try {
      this.model = new ChatGroq({
        apiKey,
        model: RESPONSE_GENERATOR_MODEL,
        temperature: RESPONSE_GENERATOR_TEMPERATURE,
        maxTokens: RESPONSE_GENERATOR_MAX_TOKENS,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize ResponseGenerator ChatGroq model');
      this.model = null;
    }
  }

  /**
   * Converts a user question, execution plan, toolResult, and memoryContext into a professional natural language response.
   *
   * @param context ResponseContext containing question, plan, toolResult, and memoryContext
   * @returns Typed AIResponse object
   */
  public async generate(context: ResponseContext): Promise<AIResponse> {
    const startTimeMs = Date.now();
    const { executionPlan, toolResult } = context;

    // Extract citations from ToolResult if available
    const citations = toolResult?.metadata?.citations || toolResult?.data?.citations || [];

    if (!this.model) {
      this.initModel();
    }

    if (!this.model) {
      logger.warn('ResponseGenerator model unavailable. Falling back to non-LLM synthesis.');
      return {
        success: true,
        answer: generateFallbackAnswer(context),
        metadata: buildResponseMetadata(executionPlan, startTimeMs, 'fallback-generator', citations),
      };
    }

    try {
      const promptText = formatGeneratorPromptInput(context);
      const messages = [
        new SystemMessage(RESPONSE_GENERATION_SYSTEM_PROMPT),
        new HumanMessage(promptText),
      ];

      const response = await this.model.invoke(messages);
      const answer = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return {
        success: true,
        answer: answer.trim(),
        metadata: buildResponseMetadata(executionPlan, startTimeMs, RESPONSE_GENERATOR_MODEL, citations),
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Error in ResponseGenerator generation. Using fallback answer.');
      return {
        success: true,
        answer: generateFallbackAnswer(context),
        metadata: buildResponseMetadata(executionPlan, startTimeMs, 'fallback-generator', citations),
      };
    }
  }
}

export const responseGenerator = new ResponseGenerator();
