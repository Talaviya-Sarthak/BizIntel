import React from 'react';
import type { ResponseCitation } from '../../types/ai.types';

interface CitationListProps {
  citations?: ResponseCitation[];
}

export const CitationList: React.FC<CitationListProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg bg-slate-900/60 border border-indigo-950/50 p-3 text-xs">
      <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>Sources & Document Citations</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-950/40 border border-indigo-800/40 text-indigo-200"
          >
            <span className="font-medium">{c.source}</span>
            {c.reference && <span className="text-slate-400">({c.reference})</span>}
          </div>
        ))}
      </div>
    </div>
  );
};
