/**
 * AI Module Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { GeneratedArtifact } from './artifacts/artifact.types.js';
import type { AIResponse, AIResponseMetadata, ResponseCitation, ResponseContext } from './generator/response.types.js';
import type { ConversationSession, MemoryContext, MemoryMessage } from './memory/memory.types.js';
import type { ExecutionPlan, NextAction, PipelineName } from './orchestrator/pipeline.types.js';
import type { IntentCategory, IntentResult } from './router/intent.types.js';
import type { AITool, ToolContext, ToolResult } from './tools/index.js';
import type { VisualizationResult } from './visualization/visualization.types.js';

export interface ChatInput {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  sessionId: string;
  answer: string;
  visualizations?: VisualizationResult[];
  artifacts?: GeneratedArtifact[];
  citations?: ResponseCitation[];
  metadata: AIResponseMetadata;
}

export type {
  IntentCategory,
  IntentResult,
  PipelineName,
  NextAction,
  ExecutionPlan,
  AITool,
  ToolContext,
  ToolResult,
  AIResponse,
  AIResponseMetadata,
  ResponseContext,
  ResponseCitation,
  ConversationSession,
  MemoryMessage,
  MemoryContext,
  VisualizationResult,
  GeneratedArtifact,
};
