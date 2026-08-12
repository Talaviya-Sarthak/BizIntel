import React from 'react';
import type { GeneratedArtifact } from '../../types/ai.types';

interface ArtifactListProps {
  artifacts?: GeneratedArtifact[];
}

export const ArtifactList: React.FC<ArtifactListProps> = ({ artifacts }) => {
  if (!artifacts || artifacts.length === 0) return null;

  const handleDownload = (artifact: GeneratedArtifact) => {
    const contentString = typeof artifact.content === 'string' ? artifact.content : String(artifact.content);
    const blob = new Blob([contentString], { type: artifact.mimeType });
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
    <div className="mt-3 pt-3 border-t border-zinc-800/80">
      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export Artifacts</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {artifacts.map((art) => (
          <button
            key={art.id}
            onClick={() => handleDownload(art)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs transition-all"
          >
            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {art.format}
            </span>
            <span className="text-zinc-200 group-hover:text-white font-medium">{art.filename}</span>
            <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-100 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};
