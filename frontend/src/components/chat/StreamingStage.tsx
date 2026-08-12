import React from 'react';
import type { SSEStage } from '../../types/ai.types';

interface StreamingStageProps {
  isStreaming: boolean;
  stage?: SSEStage;
  message?: string;
}

export const StreamingStage: React.FC<StreamingStageProps> = ({ isStreaming, stage, message }) => {
  if (!isStreaming) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 w-fit animate-pulse my-2 shadow-sm">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-200"></span>
      </div>
      <span className="font-medium text-zinc-200">{stage || 'Thinking...'}</span>
      {message && <span className="text-zinc-500 border-l border-zinc-800 pl-2">{message}</span>}
    </div>
  );
};
