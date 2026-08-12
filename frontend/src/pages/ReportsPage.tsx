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
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">📊 Enterprise Reports & Artifacts</h1>
        <p className="text-xs text-slate-400">
          View and download AI-synthesized report exports (Markdown, CSV, JSON, PDF)
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Generated Report Downloads</h3>
        {artifacts.length === 0 ? (
          <div className="text-xs text-slate-500 py-8 text-center">
            No report artifacts generated yet. Ask questions in the AI Assistant to automatically compile executive report downloads!
          </div>
        ) : (
          <ArtifactList artifacts={artifacts} />
        )}
      </div>
    </div>
  );
};
