/**
 * AI Module Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { AIResponse, AIResponseMetadata, ResponseCitation, ResponseContext } from './generator/response.types';
import type { ConversationSession, MemoryContext, MemoryMessage } from './memory/memory.types';
import type { ExecutionPlan, NextAction, PipelineName } from './orchestrator/pipeline.types';
import type { IntentCategory, IntentResult } from './router/intent.types';
import type { AITool, ToolContext, ToolResult } from './tools';

export interface ChatInput {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  sessionId: string;
  answer: string;
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
};
