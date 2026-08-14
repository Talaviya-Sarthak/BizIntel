import { knowledgeService } from '../../knowledge/knowledge.service.js';
import type { IntentCategory } from '../../router/intent.types.js';
import type { AITool } from '../tool.interface.js';
import type { ToolContext, ToolResult } from '../tool.types.js';

export class KnowledgeTool implements AITool {
  public readonly id = 'knowledge_tool';
  public readonly name = 'Knowledge Retrieval (RAG) Adapter';
  public readonly description = 'Adapter for vector indexing and enterprise document retrieval queries.';
  public readonly supportedIntent: IntentCategory = 'knowledge';

  public async execute(context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();

    const ragResult = await knowledgeService.queryKnowledge(context.query);

    return {
      success: true,
      toolId: this.id,
      data: {
        answer: ragResult.answer,
        retrievedChunkCount: ragResult.chunks.length,
        citations: ragResult.citations,
        query: context.query,
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
        citations: ragResult.citations,
      },
    };
  }
}
