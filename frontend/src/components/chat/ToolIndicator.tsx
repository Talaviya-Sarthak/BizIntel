import React from 'react';
import type { AIResponseMetadata } from '../../types/ai.types';

interface ToolIndicatorProps {
  metadata?: AIResponseMetadata;
}

export const ToolIndicator: React.FC<ToolIndicatorProps> = ({ metadata }) => {
  if (!metadata) return null;

  const getToolColor = (tool: string) => {
    switch (tool) {
      case 'analytics_tool':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/40';
      case 'backtesting_tool':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/40';
      case 'retail_tool':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
      case 'knowledge_tool':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/40';
      default:
        return 'bg-slate-800/60 text-slate-300 border-slate-700/40';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded border font-mono ${getToolColor(
          metadata.tool,
        )}`}
      >
        🔧 Tool: {metadata.tool}
      </span>
      <span className="inline-flex items-center px-2 py-0.5 rounded border bg-slate-900/60 text-slate-400 border-slate-800 font-mono">
        ⚡ {metadata.pipeline}
      </span>
      <span className="inline-flex items-center px-2 py-0.5 rounded border bg-slate-900/60 text-slate-400 border-slate-800 font-mono">
        🤖 {metadata.model}
      </span>
      <span className="text-slate-500 font-mono">({metadata.executionTimeMs}ms)</span>
    </div>
  );
};
