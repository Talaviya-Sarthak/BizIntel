import type { IntentCategory } from '../router/intent.types.js';
import type { NextAction, PipelineName } from './pipeline.types.js';

export interface PipelineMapping {
  pipeline: PipelineName;
  selectedTool: string;
  defaultNextAction: NextAction;
  description: string;
}

/** Immutable mapping of intent categories to execution pipelines & selected tool IDs */
export const INTENT_PIPELINE_MAP: Record<IntentCategory, PipelineMapping> = {
  analytics: {
    pipeline: 'ANALYTICS_PIPELINE',
    selectedTool: 'analytics_tool',
    defaultNextAction: 'CALL_ANALYTICS_TOOL',
    description: 'Routes query to analytical engine and DuckDB tool suite.',
  },
  backtesting: {
    pipeline: 'BACKTEST_PIPELINE',
    selectedTool: 'backtesting_tool',
    defaultNextAction: 'CALL_BACKTEST_TOOL',
    description: 'Routes query to quantitative backtesting strategy engine.',
  },
  retail: {
    pipeline: 'RETAIL_PIPELINE',
    selectedTool: 'retail_tool',
    defaultNextAction: 'CALL_PRODUCT_TOOL',
    description: 'Routes query to product catalog and retail search service.',
  },
  knowledge: {
    pipeline: 'KNOWLEDGE_PIPELINE',
    selectedTool: 'knowledge_tool',
    defaultNextAction: 'CALL_RAG',
    description: 'Routes query to vector index and knowledge retrieval pipeline.',
  },
  general: {
    pipeline: 'GENERAL_PIPELINE',
    selectedTool: 'general_tool',
    defaultNextAction: 'RESPOND_DIRECTLY',
    description: 'Routes query to direct conversational response handler.',
  },
};

/** Default fallback mapping if an intent is missing or unsupported */
export const FALLBACK_PIPELINE_MAPPING: PipelineMapping = {
  pipeline: 'GENERAL_PIPELINE',
  selectedTool: 'general_tool',
  defaultNextAction: 'RESPOND_DIRECTLY',
  description: 'Fallback pipeline triggered due to unsupported intent or planning error.',
};
