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
    <div className="flex items-center gap-3 p-3 my-2 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 animate-pulse">
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
      </div>
      <div>
        <span className="font-bold text-indigo-200 uppercase tracking-wide mr-2">
          {stage || 'Processing...'}
        </span>
        <span className="text-slate-300">{message || 'Executing Enterprise AI Pipeline'}</span>
      </div>
    </div>
  );
};
