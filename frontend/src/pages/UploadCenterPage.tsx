import React, { useEffect, useState } from 'react';
import { fetchUploads, type UploadRecord } from '../api/upload.api';
import { FileDropzone } from '../components/upload/FileDropzone';

export const UploadCenterPage: React.FC = () => {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);

  const loadUploads = async () => {
    try {
      const list = await fetchUploads();
      setUploads(list);
    } catch (err) {
      // Handle error
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">📤 Enterprise Upload Center</h1>
        <p className="text-xs text-slate-400">
          Upload PDF, DOCX, TXT, Markdown, CSV, and Excel datasets for indexing and profiling
        </p>
      </div>

      <FileDropzone onIngestSuccess={() => loadUploads()} />

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Upload History</h3>

        {uploads.length === 0 ? (
          <div className="text-xs text-slate-500 py-4 text-center">No files uploaded yet.</div>
        ) : (
          <div className="space-y-2">
            {uploads.map((file) => (
              <div
                key={file.fileId}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-indigo-950 text-indigo-400 font-mono text-[10px] uppercase font-bold">
                    {file.fileType}
                  </span>
                  <div>
                    <div className="font-semibold text-slate-200">{file.filename}</div>
                    <div className="text-[11px] text-slate-400">
                      {(file.sizeBytes / 1024).toFixed(1)} KB • {file.chunkCount} vector chunks
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Ready
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
