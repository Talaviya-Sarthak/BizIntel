import { AnalyticsTool } from './adapters/analytics.tool.js';
import { BacktestingTool } from './adapters/backtesting.tool.js';
import { GeneralTool } from './adapters/general.tool.js';
import { KnowledgeTool } from './adapters/knowledge.tool.js';
import { RetailTool } from './adapters/retail.tool.js';
import { toolRegistry, ToolRegistry } from './tool.registry.js';

/**
 * Initializes and registers default system tool adapters.
 */
export function initializeDefaultTools(registry: ToolRegistry = toolRegistry): ToolRegistry {
  const tools = [
    new AnalyticsTool(),
    new BacktestingTool(),
    new RetailTool(),
    new KnowledgeTool(),
    new GeneralTool(),
  ];

  for (const tool of tools) {
    if (!registry.find(tool.id)) {
      registry.register(tool);
    }
  }

  return registry;
}
