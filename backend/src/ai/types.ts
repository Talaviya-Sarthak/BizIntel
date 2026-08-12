/**
 * AI Module Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { IntentCategory, IntentResult } from './router/intent.types';
import type { ExecutionPlan, NextAction, PipelineName } from './orchestrator/pipeline.types';
import type { AITool, ToolContext, ToolResult } from './tools';

export interface ChatInput {
  message: string;
}

export interface ChatResponse {
  success: boolean;
  result: ToolResult;
  plan: ExecutionPlan;
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
};
