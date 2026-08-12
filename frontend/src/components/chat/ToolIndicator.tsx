import React, { useState } from 'react';
import type { AIResponseMetadata } from '../../types/ai.types';

interface ToolIndicatorProps {
  metadata?: AIResponseMetadata;
}

export const ToolIndicator: React.FC<ToolIndicatorProps> = ({ metadata }) => {
  const [open, setOpen] = useState(false);

  if (!metadata) return null;

  return (
    <div className="mb-2 text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-colors font-medium text-[11px]"
      >
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>Execution Details</span>
        <span className="text-[10px] text-zinc-500 font-mono">({metadata.executionTimeMs}ms)</span>
      </button>

      {open && (
        <div className="mt-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Tool Adapter:</span>
            <span className="text-zinc-200 font-semibold">{metadata.tool}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Pipeline:</span>
            <span className="text-zinc-300">{metadata.pipeline}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Model:</span>
            <span className="text-zinc-300">{metadata.model}</span>
          </div>
        </div>
      )}
    </div>
  );
};
