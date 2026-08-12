/**
 * AI Module Constants
 * PS-05 Enterprise Intelligence Platform
 */

/** Primary Target LLM model hosted on Groq API */
export const GROQ_LLM_MODEL = 'llama-3.3-70b-versatile';

/** Secondary fallback models used if rate limits or quota errors occur on primary model */
export const GROQ_FALLBACK_MODELS = ['llama-3.1-8b-instant', 'llama3-8b-8192', 'gemma2-9b-it'];

/** Default generation temperature (low temperature for deterministic, factual business responses) */
export const DEFAULT_AI_TEMPERATURE = 0.2;

/** Maximum response tokens allowed per query */
export const MAX_AI_TOKENS = 2048;
