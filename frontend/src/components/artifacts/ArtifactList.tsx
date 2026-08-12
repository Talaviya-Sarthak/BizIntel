import React from 'react';
import type { GeneratedArtifact } from '../../types/ai.types';

interface ArtifactListProps {
  artifacts?: GeneratedArtifact[];
}

export const ArtifactList: React.FC<ArtifactListProps> = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) return null;

  const handleDownload = (artifact: GeneratedArtifact) => {
    const contentString = typeof artifact.content === 'string' ? artifact.content : String(artifact.content);
    const blob = new Blob([contentString], {
      type: artifact.mimeType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        📥 Generated Report Exports
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {artifacts.map((art) => (
          <div
            key={art.id}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all text-xs"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="p-1.5 rounded bg-indigo-950 text-indigo-400 font-mono text-[10px] uppercase font-bold">
                {art.format}
              </span>
              <span className="truncate font-medium text-slate-200">{art.filename}</span>
            </div>
            <button
              onClick={() => handleDownload(art)}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors shrink-0"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
