import React, { useEffect, useState } from 'react';
import { fetchUploads, type UploadRecord } from '../api/upload.api';
import { FileDropzone } from '../components/upload/FileDropzone';

export const KnowledgeBasePage: React.FC = () => {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUploads = async () => {
    try {
      const list = await fetchUploads();
      setUploads(list);
    } catch (err) {
      // Error fetching uploads
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">📚 Enterprise Knowledge Base (RAG)</h1>
          <p className="text-xs text-slate-400">
            Ingest enterprise documents into the high-performance Vector Indexing store for RAG querying
          </p>
        </div>
      </div>

      {/* Drag & Drop File Upload Component */}
      <FileDropzone onIngestSuccess={() => loadUploads()} />

      {/* Ingested Documents List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <span>📄 Ingested Document Vector Index</span>
          <span className="text-xs font-normal text-slate-400">({uploads.length} documents)</span>
        </h3>

        {loading ? (
          <div className="text-xs text-slate-400 py-4 animate-pulse">Loading vector index...</div>
        ) : uploads.length === 0 ? (
          <div className="text-xs text-slate-500 py-6 text-center">
            No documents ingested yet. Upload PDF, DOCX, TXT, or Markdown above to seed your RAG vector index.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-2.5">Document Filename</th>
                  <th className="p-2.5">Format</th>
                  <th className="p-2.5">Size</th>
                  <th className="p-2.5">Vector Chunks</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((file) => (
                  <tr key={file.fileId} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                    <td className="p-2.5 font-medium text-slate-200">{file.filename}</td>
                    <td className="p-2.5 uppercase text-slate-400 font-mono text-[10px]">{file.fileType}</td>
                    <td className="p-2.5 text-slate-400 font-mono">{(file.sizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="p-2.5 font-bold text-indigo-400">{file.chunkCount} chunks</td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        ✓ INDEXED
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-500 text-[11px]">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
