import React, { useState } from 'react';
import { ingestDocument, type IngestResponse } from '../../api/upload.api';

interface FileDropzoneProps {
  onIngestSuccess?: (res: IngestResponse) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onIngestSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setStatusMsg(`Reading "${file.name}"...`);

    try {
      let content: string;
      const isBinary = /\.(pdf|docx|doc|xlsx|xls)$/i.test(file.name);

      if (isBinary) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binaryStr = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binaryStr += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
        }
        content = `data:${file.type || 'application/octet-stream'};base64,${btoa(binaryStr)}`;
      } else {
        content = await file.text();
      }

      setStatusMsg(`Ingesting "${file.name}" into Supabase pgvector...`);
      const res = await ingestDocument(file.name, content);

      if (res.success && res.chunkCount > 0) {
        setStatusMsg(`✅ Indexed "${file.name}" into ${res.chunkCount} semantic chunks in Supabase!`);
      } else {
        setStatusMsg(`⚠️ Upload issue: ${res.message}`);
      }

      if (onIngestSuccess) onIngestSuccess(res);
    } catch (err: any) {
      setStatusMsg(`❌ Upload failed: ${err?.message || 'Error uploading document'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/50 transition-all text-center"
    >
      <div className="p-3 rounded-full bg-indigo-950/60 text-indigo-400 mb-3">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <h3 className="text-sm font-semibold text-slate-200">
        Drag & Drop enterprise files to ingest
      </h3>
      <p className="text-xs text-slate-400 mt-1 mb-4">
        Supports PDF, DOCX, TXT, Markdown, CSV, and Excel (up to 50MB)
      </p>

      <label className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer transition-colors shadow-sm">
        Browse Files
        <input
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md,.csv,.xlsx"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />
      </label>

      {statusMsg && (
        <div className={`mt-4 text-xs font-medium ${isUploading ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'}`}>
          {statusMsg}
        </div>
      )}
    </div>
  );
};
