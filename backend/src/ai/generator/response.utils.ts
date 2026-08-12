import type { ExecutionPlan } from '../orchestrator/pipeline.types';
import type { ToolResult } from '../tools/tool.types';
import type { AIResponseMetadata, ResponseCitation, ResponseContext } from './response.types';
import { buildConversationPrompt } from '../memory/memory.utils';

/**
 * Builds standard AIResponseMetadata object.
 */
export function buildResponseMetadata(
  plan: ExecutionPlan,
  startTimeMs: number,
  modelName: string,
  citations: ResponseCitation[] = [],
): AIResponseMetadata {
  return {
    intent: plan.intent,
    pipeline: plan.pipeline,
    tool: plan.selectedTool,
    model: modelName,
    executionTimeMs: Date.now() - startTimeMs,
    citations,
  };
}

/**
 * Formats user question, execution plan, memory context, and tool result payload into prompt text for LLM generation.
 */
export function formatGeneratorPromptInput(context: ResponseContext): string {
  const { userQuestion, executionPlan, toolResult, memoryContext } = context;

  const parts: string[] = [];

  if (memoryContext) {
    const memoryPrompt = buildConversationPrompt(memoryContext);
    if (memoryPrompt) {
      parts.push(memoryPrompt);
    }
  }

  parts.push(`CURRENT USER QUESTION:
"${userQuestion}"

CLASSIFIED INTENT:
${executionPlan.intent}

CURRENT TOOL RESULT PAYLOAD:
${JSON.stringify(toolResult.data, null, 2)}

Please provide a concise, executive Markdown response answering the current user question based strictly on the context and current tool result payload above.`);

  return parts.join('\n\n---\n\n');
}

/**
 * Generates a structured non-LLM fallback response if the LLM generation service fails or times out.
 */
export function generateFallbackAnswer(context: ResponseContext): string {
  const { toolResult, executionPlan } = context;
  const data = toolResult?.data || {};

  if (executionPlan.intent === 'analytics') {
    const datasetCount = data.totalDatasets ?? 0;
    return `### Analytics Summary\n\n- **Total Datasets Available**: ${datasetCount}\n- **DataMart Status**: ${data.datamartOverview ? 'Active' : 'Unavailable'}\n\n*Note: Complete narrative synthesis is operating in fallback mode.*`;
  }

  if (executionPlan.intent === 'backtesting') {
    const stratCount = Array.isArray(data.availableStrategies) ? data.availableStrategies.length : 0;
    return `### Backtesting Overview\n\n- **Available Strategies**: ${stratCount}\n- **Historical Backtests**: ${data.userBacktestCount ?? 0}\n\n*Note: Complete strategy narrative synthesis is operating in fallback mode.*`;
  }

  if (executionPlan.intent === 'knowledge') {
    return data.answer || data.message || 'The available knowledge base does not contain enough information to answer this question confidently.';
  }

  if (executionPlan.intent === 'retail') {
    return `### Retail Catalog Inquiry\n\n${data.actionRequired || 'Retail product catalog inquiry processed.'}`;
  }

  return data.response || 'Hello! Your query has been processed successfully by the platform.';
}
