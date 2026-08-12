import React from 'react';
import { ArtifactList } from '../components/artifacts/ArtifactList';
import { useChatStore } from '../store/useChatStore';
import type { ChatMessage, GeneratedArtifact } from '../types/ai.types';

export const ReportsPage: React.FC = () => {
  const { messages } = useChatStore();

  // Aggregate generated report artifacts across conversation messages
  const artifacts: GeneratedArtifact[] = [];
  messages.forEach((msg: ChatMessage) => {
    if (msg.artifacts) {
      artifacts.push(...msg.artifacts);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-white/[0.06] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Enterprise Reports & Exports</h1>
        <p className="mt-1 text-xs text-zinc-400">
          View and download AI-synthesized report exports (Markdown, CSV, JSON, PDF) generated during your sessions.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#181818] p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-zinc-100 mb-3 border-b border-white/[0.06] pb-2">Generated Report Downloads</h3>
        {artifacts.length === 0 ? (
          <div className="text-xs text-zinc-400 py-12 text-center">
            No report artifacts generated yet. Ask questions in the AI Assistant to automatically compile executive report downloads!
          </div>
        ) : (
          <ArtifactList artifacts={artifacts} />
        )}
      </div>
    </div>
  );
};
