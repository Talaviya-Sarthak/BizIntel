import { env } from '../config/env';
import { ApiError } from '../utils/httpError';
import { artifactGenerator, ArtifactGenerator } from './artifacts/artifact.generator';
import type { GeneratedArtifact } from './artifacts/artifact.types';
import { executionEngine, ExecutionEngine } from './execution/execution.service';
import { responseGenerator } from './generator/response.generator';
import type { AIResponse } from './generator/response.types';
import { memoryManager } from './memory/memory.manager';
import { aiOrchestrator } from './orchestrator/orchestrator';
import { intentRouter } from './router/router';
import { initializeDefaultTools } from './tools/tool.factory';
import { toolRegistry } from './tools/tool.registry';
import type { ToolContext } from './tools/tool.types';
import { visualizationService, VisualizationService } from './visualization/visualization.generator';
import type { VisualizationResult } from './visualization/visualization.types';

export interface AIServiceChatResult {
  sessionId: string;
  response: AIResponse;
  visualizations: VisualizationResult[];
  artifacts: GeneratedArtifact[];
}

export class AIService {
  constructor(
    private readonly execEngine: ExecutionEngine = executionEngine,
    private readonly vizService: VisualizationService = visualizationService,
    private readonly artGenerator: ArtifactGenerator = artifactGenerator,
  ) {
    initializeDefaultTools(toolRegistry);
  }

  /**
   * Complete multi-turn, multi-tool, visualization & artifact-enabled Enterprise AI pipeline execution.
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

    // 1. Session Init / Retrieval & Save User Message
    const session = memoryManager.getOrCreateSession(sessionId, userId);
    memoryManager.saveUserMessage(session.sessionId, message);

    // 2. Classify Intent & Plan Execution
    const intentResult = await intentRouter.classify(message);
    const executionPlan = aiOrchestrator.plan(intentResult);

    // 3. Multi-Step Execution Graph Build & Execution
    const graph = this.execEngine.buildGraph(executionPlan);
    const context: ToolContext = {
      query: message,
      userId,
      sessionId: session.sessionId,
      executionPlan,
    };
    const multiResult = await this.execEngine.executeGraph(graph, context);

    const primaryStep = multiResult.stepResults[0];
    const toolResult = primaryStep?.result || {
      success: false,
      toolId: executionPlan.selectedTool,
      data: {},
      metadata: { executionTimeMs: 0, intent: executionPlan.intent, timestamp: new Date().toISOString() },
    };

    // 4. Save Tool Result & Build Memory Context
    memoryManager.saveToolResult(session.sessionId, toolResult);
    const memoryContext = memoryManager.buildContext(session.sessionId, message, executionPlan, toolResult);

    // 5. Synthesize Executive Response
    const response = await responseGenerator.generate({
      userQuestion: message,
      executionPlan,
      toolResult,
      memoryContext,
    });

    // 6. Generate Visualizations & Artifact Exports
    const visualizations = this.vizService.generateVisualizations(toolResult);
    const artifact = this.artGenerator.generateReportArtifact(
      `Analysis_${executionPlan.intent}`,
      response.answer,
      toolResult,
      response.metadata.citations || [],
      'markdown',
    );

    // 7. Save Assistant Message & Maintain Memory
    memoryManager.saveAssistantMessage(session.sessionId, response.answer);
    void memoryManager.summarizeConversation(session.sessionId);
    memoryManager.trimConversation(session.sessionId);

    return {
      sessionId: session.sessionId,
      response,
      visualizations,
      artifacts: [artifact],
    };
  }
}

export const aiService = new AIService();
