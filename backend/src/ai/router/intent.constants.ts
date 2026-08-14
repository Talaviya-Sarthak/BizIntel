import type { IntentCategory } from './intent.types.js';

/** Array of all valid intent category literals */
export const SUPPORTED_INTENTS: readonly IntentCategory[] = [
  'analytics',
  'backtesting',
  'retail',
  'knowledge',
  'general',
] as const;

/** Default fallback intent when classification fails or confidence is too low */
export const DEFAULT_FALLBACK_INTENT: IntentCategory = 'general';

/** Minimum confidence score required to accept classification (below this falls back to general) */
export const MIN_INTENT_CONFIDENCE_THRESHOLD = 0.6;

/** Temperature set to 0.0 for deterministic classification */
export const INTENT_ROUTER_TEMPERATURE = 0.0;

/** Descriptions for each intent category used by the classification prompt */
export const INTENT_DESCRIPTIONS: Record<IntentCategory, string> = {
  analytics:
    'User is asking to view, aggregate, compute, or compare statistical data, sales metrics, revenues, top categories, or dataset trends.',
  backtesting:
    'User is asking to run, configure, explain, or inspect quantitative trading strategy performance, metrics (Sharpe, Drawdown, CAGR), or indicators (SMA, RSI, Bollinger).',
  retail:
    'User is asking for product recommendations, price inquiries, product comparisons, similar items, or catalog searches (e.g. laptops under $1000).',
  knowledge:
    'User is asking general conceptual/domain questions (e.g. "What is CAGR?", "How does RSI work?", "Explain inventory turnover"). These are educational/domain questions.',
  general:
    'Greetings, conversational filler (hi, hello, thanks), meta questions about assistant capabilities, or ambiguous inputs that do not fit other intents.',
};
