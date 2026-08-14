import React, { useState, useEffect } from 'react';
import { ingestDocument, type IngestResponse } from '../../api/upload.api';

interface FileDropzoneProps {
  onIngestSuccess?: (res: IngestResponse) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onIngestSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentFileSize, setCurrentFileSize] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer tick during document upload & ingestion
  useEffect(() => {
    let timer: any;
    if (isUploading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isUploading]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleFile = async (file: File) => {
    setIsUploading(true);
    setCurrentFileName(file.name);
    setCurrentFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setStatusType('info');
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

      setStatusMsg(`Parsing pages, creating semantic chunks & vector embeddings in Supabase...`);
      const res = await ingestDocument(file.name, content);

      if (res.success && res.chunkCount > 0) {
        setStatusType('success');
        setStatusMsg(`✅ Successfully indexed "${file.name}" into ${res.chunkCount} semantic vector chunks!`);
      } else {
        setStatusType('error');
        setStatusMsg(`⚠️ Upload issue: ${res.message}`);
      }

      if (onIngestSuccess) onIngestSuccess(res);
    } catch (err: any) {
      setStatusType('error');
      setStatusMsg(`❌ Upload failed: ${err?.message || 'Error uploading document'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !isUploading) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Box Container */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all text-center ${
          isUploading
            ? 'border-amber-500/60 bg-[#161618] shadow-lg'
            : 'border-zinc-800 hover:border-zinc-600 bg-[#121214] hover:bg-[#151518]'
        }`}
      >
        {!isUploading ? (
          <>
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 mb-3 shadow-inner">
              <svg className="w-7 h-7 text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Drag & drop files to ingest into Knowledge Base
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-5 max-w-md">
              Supports PDF, DOCX, TXT, Markdown, CSV, and Excel (up to 50MB)
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs cursor-pointer transition-all shadow-md active:scale-95">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Select File to Ingest</span>
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
          </>
        ) : (
          /* Active Processing & Live Timer Display */
          <div className="w-full max-w-lg space-y-4 py-2 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Processing & Indexing Document
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                <svg className="w-3.5 h-3.5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>

            {/* Active File Metadata */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm">📄</div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-zinc-100 truncate">{currentFileName}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">{currentFileSize}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold shrink-0">
                INGESTING
              </span>
            </div>

            {/* Status Message */}
            <div className="text-xs text-zinc-300 font-medium animate-pulse flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>{statusMsg}</span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
              <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 h-full rounded-full animate-pulse w-full"></div>
            </div>

            {/* High-visibility Notice Banner */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <span>⏳ Processing Notice (Please Wait)</span>
              </div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                For multi-page documents (e.g. 24-page PDFs), text extraction, chunking, and AI vector embedding generation typically take <strong>2 to 5 minutes</strong> on server. Please keep this tab open until indexing completes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Completion or Error Status Toast */}
      {!isUploading && statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 shadow-sm ${
            statusType === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : statusType === 'error'
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}
        >
          <span className="text-sm shrink-0">{statusType === 'success' ? '✅' : statusType === 'error' ? '❌' : 'ℹ️'}</span>
          <div className="flex-1 leading-snug">{statusMsg}</div>
        </div>
      )}
    </div>
  );
};

