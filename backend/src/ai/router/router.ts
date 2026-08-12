import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { GROQ_LLM_MODEL } from '../constants';
import {
  DEFAULT_FALLBACK_INTENT,
  INTENT_ROUTER_TEMPERATURE,
  MIN_INTENT_CONFIDENCE_THRESHOLD,
  SUPPORTED_INTENTS,
} from './intent.constants';
import { INTENT_CLASSIFICATION_SYSTEM_PROMPT } from './intent.prompts';
import type { IntentCategory, IntentResult } from './intent.types';

export class IntentRouter {
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
        model: GROQ_LLM_MODEL,
        temperature: INTENT_ROUTER_TEMPERATURE,
        maxTokens: 256,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize IntentRouter ChatGroq model');
      this.model = null;
    }
  }

  /**
   * Classify user query intent into one of the 5 supported categories.
   *
   * @param query Raw user input text
   * @returns IntentResult carrying intent, confidence score, and rationale
   */
  public async classify(query: string): Promise<IntentResult> {
    const fallbackResult: IntentResult = {
      intent: DEFAULT_FALLBACK_INTENT,
      confidence: 0.5,
      reason: 'Default fallback intent triggered due to parsing error or low confidence',
    };

    if (!query || !query.trim()) {
      return {
        intent: 'general',
        confidence: 1.0,
        reason: 'Empty query defaults to general intent',
      };
    }

    if (!this.model) {
      this.initModel();
      if (!this.model) return fallbackResult;
    }

    try {
      const messages = [
        new SystemMessage(INTENT_CLASSIFICATION_SYSTEM_PROMPT),
        new HumanMessage(query.trim()),
      ];

      const response = await this.model.invoke(messages);
      const rawContent = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return this.parseAndValidateResponse(rawContent);
    } catch (error: any) {
      logger.error({ err: error, query }, 'Error during IntentRouter classification');
      return fallbackResult;
    }
  }

  /**
   * Cleans JSON markdown fences, parses JSON, and validates intent against supported criteria.
   */
  private parseAndValidateResponse(rawContent: string): IntentResult {
    const fallbackResult: IntentResult = {
      intent: DEFAULT_FALLBACK_INTENT,
      confidence: 0.5,
      reason: 'Failed to parse JSON classification output',
    };

    try {
      let cleaned = rawContent.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      if (!parsed || typeof parsed !== 'object') {
        return fallbackResult;
      }

      let intent = String(parsed.intent || '').toLowerCase() as IntentCategory;
      let confidence = Number(parsed.confidence);
      let reason = String(parsed.reason || 'Intent classified');

      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        confidence = 0.5;
      }

      if (!SUPPORTED_INTENTS.includes(intent)) {
        intent = DEFAULT_FALLBACK_INTENT;
        reason = `Unrecognized intent "${parsed.intent}", falling back to ${DEFAULT_FALLBACK_INTENT}`;
      }

      if (confidence < MIN_INTENT_CONFIDENCE_THRESHOLD) {
        intent = DEFAULT_FALLBACK_INTENT;
        reason = `Classification confidence (${confidence.toFixed(2)}) below threshold (${MIN_INTENT_CONFIDENCE_THRESHOLD}), falling back to ${DEFAULT_FALLBACK_INTENT}`;
      }

      return {
        intent,
        confidence,
        reason,
      };
    } catch (parseError) {
      logger.warn({ rawContent, err: parseError }, 'Failed to parse JSON from IntentRouter');
      return fallbackResult;
    }
  }
}

export const intentRouter = new IntentRouter();
