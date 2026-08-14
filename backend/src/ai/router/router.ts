import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { GROQ_LLM_MODEL } from '../constants.js';
import {
  DEFAULT_FALLBACK_INTENT,
  INTENT_ROUTER_TEMPERATURE,
  MIN_INTENT_CONFIDENCE_THRESHOLD,
  SUPPORTED_INTENTS,
} from './intent.constants.js';
import { INTENT_CLASSIFICATION_SYSTEM_PROMPT } from './intent.prompts.js';
import type { IntentCategory, IntentResult } from './intent.types.js';

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
   * Fast deterministic heuristic intent detector to ensure business data queries never fall through to general intent.
   */
  private detectHeuristicIntent(query: string): IntentResult | null {
    const q = query.toLowerCase();

    // Analytics Keywords
    if (
      q.includes('product') ||
      q.includes('revenue') ||
      q.includes('sales') ||
      q.includes('order') ||
      q.includes('customer') ||
      q.includes('units') ||
      q.includes('total') ||
      q.includes('top') ||
      q.includes('highest') ||
      q.includes('lowest') ||
      q.includes('month') ||
      q.includes('trend') ||
      q.includes('column') ||
      q.includes('schema') ||
      q.includes('dataset') ||
      q.includes('analyze') ||
      q.includes('analysis') ||
      q.includes('amount') ||
      q.includes('region') ||
      q.includes('row')
    ) {
      return {
        intent: 'analytics',
        confidence: 0.98,
        reason: 'Deterministic keyword match for analytics intent',
      };
    }

    // Backtesting Keywords
    if (
      q.includes('backtest') ||
      q.includes('strategy') ||
      q.includes('sma') ||
      q.includes('rsi') ||
      q.includes('drawdown') ||
      q.includes('sharpe') ||
      q.includes('trading') ||
      q.includes('crossover')
    ) {
      return {
        intent: 'backtesting',
        confidence: 0.98,
        reason: 'Deterministic keyword match for backtesting intent',
      };
    }

    // Knowledge RAG Keywords
    if (
      q.includes('policy') ||
      q.includes('handbook') ||
      q.includes('document') ||
      q.includes('refund') ||
      q.includes('leave') ||
      q.includes('file') ||
      q.includes('pdf') ||
      q.includes('rules')
    ) {
      return {
        intent: 'knowledge',
        confidence: 0.98,
        reason: 'Deterministic keyword match for knowledge intent',
      };
    }

    // Retail Catalog Keywords
    if (
      q.includes('sku') ||
      q.includes('inventory') ||
      q.includes('catalog') ||
      q.includes('price') ||
      q.includes('stock')
    ) {
      return {
        intent: 'retail',
        confidence: 0.98,
        reason: 'Deterministic keyword match for retail intent',
      };
    }

    return null;
  }

  /**
   * Classify user query intent into one of the 5 supported categories.
   *
   * @param query Raw user input text
   * @returns IntentResult carrying intent, confidence score, and rationale
   */
  public async classify(query: string): Promise<IntentResult> {
    const qTrimmed = (query || '').trim();

    if (!qTrimmed) {
      return {
        intent: 'general',
        confidence: 1.0,
        reason: 'Empty query defaults to general intent',
      };
    }

    // 1. Fast deterministic heuristic check first
    const heuristic = this.detectHeuristicIntent(qTrimmed);
    if (heuristic) {
      logger.info({ query: qTrimmed, intent: heuristic.intent, confidence: heuristic.confidence }, 'Intent Router (Heuristic Match)');
      return heuristic;
    }

    const fallbackResult: IntentResult = {
      intent: DEFAULT_FALLBACK_INTENT,
      confidence: 0.5,
      reason: 'Default fallback intent triggered due to parsing error or low confidence',
    };

    if (!this.model) {
      this.initModel();
      if (!this.model) return fallbackResult;
    }

    try {
      const messages = [
        new SystemMessage(INTENT_CLASSIFICATION_SYSTEM_PROMPT),
        new HumanMessage(qTrimmed),
      ];

      const response = await this.model.invoke(messages);
      const rawContent = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      const parsed = this.parseAndValidateResponse(rawContent);
      logger.info({ query: qTrimmed, intent: parsed.intent, confidence: parsed.confidence, reason: parsed.reason }, 'Intent Router (LLM Classified)');
      return parsed;
    } catch (error: any) {
      logger.error({ err: error, query: qTrimmed }, 'Error during IntentRouter classification');
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
