import type { ToolContext } from '../tools/tool.types.js';
import type { ExecutionPlanGraph } from './execution.types.js';

export interface MultiStepExecutionContext extends ToolContext {
  graph: ExecutionPlanGraph;
  accumulatedResults: Record<string, any>;
}

export function createExecutionContext(
  baseContext: ToolContext,
  graph: ExecutionPlanGraph,
): MultiStepExecutionContext {
  return {
    ...baseContext,
    graph,
    accumulatedResults: {},
  };
}
