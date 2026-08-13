import React, { useEffect, useState } from 'react';
import { deleteDocument, fetchUploads, type UploadRecord } from '../api/upload.api';
import { FileDropzone } from '../components/upload/FileDropzone';

export const KnowledgeBasePage: React.FC = () => {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<UploadRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<UploadRecord | null>(null);

  const loadUploads = async () => {
    setLoading(true);
    try {
      const list = await fetchUploads();
      setUploads(list);
    } catch (err) {
      console.error('Failed to load stored RAG documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

  const handleDelete = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await deleteDocument(fileId);
      await loadUploads();
      setConfirmDeleteDoc(null);
    } catch (err: any) {
      alert(`Failed to delete document: ${err?.message || 'Error occurred'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = uploads.reduce((acc, u) => acc + (u.pageCount || 1), 0);
  const totalChunks = uploads.reduce((acc, u) => acc + (u.chunkCount || 0), 0);
  const totalBytes = uploads.reduce((acc, u) => acc + (u.sizeBytes || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            <span>📚 Enterprise Knowledge Base</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-950/80 text-indigo-400 border border-indigo-800/50">
              Supabase pgvector
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persistent Document Manager — All uploaded knowledge files are indexed and saved permanently across sessions
          </p>
        </div>

        <button
          onClick={loadUploads}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Syncing Store...' : 'Refresh Index'}</span>
        </button>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="text-xs font-medium text-slate-400">Total Documents</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{loading ? '...' : uploads.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Persisted in Supabase</div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="text-xs font-medium text-slate-400">Semantic Chunks</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{loading ? '...' : totalChunks.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Indexed vectors</div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="text-xs font-medium text-slate-400">Total Pages Extracted</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{loading ? '...' : totalPages.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Parsed document pages</div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="text-xs font-medium text-slate-400">Storage Footprint</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {loading ? '...' : (totalBytes / (1024 * 1024)).toFixed(2)} MB
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Raw file payload</div>
        </div>
      </div>

      {/* Drag & Drop File Upload Component */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Upload & Index New Document</h2>
        <FileDropzone onIngestSuccess={() => loadUploads()} />
      </div>

      {/* Ingested Documents List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>📄 Knowledge Document Store</span>
            <span className="text-xs font-mono font-normal text-slate-400">({uploads.length} persistent files)</span>
          </h3>
        </div>

        {loading ? (
          /* Skeleton Loader List */
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-lg border border-slate-800/50 bg-slate-800/20">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-8 h-8 rounded bg-slate-800"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-800/60 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-3 bg-slate-800 rounded w-1/6"></div>
                <div className="h-3 bg-slate-800 rounded w-1/6"></div>
                <div className="h-6 bg-slate-800 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : uploads.length === 0 ? (
          /* Empty State */
          <div className="py-12 text-center space-y-3 border-2 border-dashed border-slate-800 rounded-xl">
            <div className="inline-flex p-3 rounded-full bg-slate-800/50 text-slate-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-slate-300">No documents uploaded yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload PDF, DOCX, TXT, or Markdown documents above to seed your RAG vector index. Documents will persist across sessions.
            </p>
          </div>
        ) : (
          /* Persistent Table List */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3 font-semibold">Document Filename</th>
                  <th className="p-3 font-semibold">Format</th>
                  <th className="p-3 font-semibold">Size</th>
                  <th className="p-3 font-semibold">Pages</th>
                  <th className="p-3 font-semibold">Chunks</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Uploaded Date</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {uploads.map((file) => {
                  const formatUpper = (file.fileType || 'pdf').toUpperCase();
                  const isPdf = formatUpper === 'PDF';
                  return (
                    <tr key={file.fileId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-medium text-slate-200 flex items-center gap-2.5">
                        <span className={`p-1.5 rounded text-[10px] font-bold font-mono ${isPdf ? 'bg-red-950/70 text-red-400 border border-red-800/40' : 'bg-indigo-950/70 text-indigo-400 border border-indigo-800/40'}`}>
                          {isPdf ? '📄 PDF' : `📝 ${formatUpper}`}
                        </span>
                        <span className="truncate max-w-xs">{file.filename}</span>
                      </td>
                      <td className="p-3 uppercase text-slate-400 font-mono text-[10px]">{formatUpper}</td>
                      <td className="p-3 text-slate-400 font-mono">
                        {file.sizeBytes ? (file.sizeBytes / 1024).toFixed(1) + ' KB' : '—'}
                      </td>
                      <td className="p-3 text-slate-300 font-mono">{file.pageCount || 1} pgs</td>
                      <td className="p-3 font-bold text-indigo-400 font-mono">{file.chunkCount || 0} chunks</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          <span>✓</span>
                          <span>{file.status || 'READY'}</span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'System'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedDoc(file)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition-colors"
                        >
                          Details
                        </button>

                        <button
                          onClick={() => setConfirmDeleteDoc(file)}
                          disabled={deletingId === file.fileId}
                          className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 font-medium text-[11px] transition-colors disabled:opacity-50"
                        >
                          {deletingId === file.fileId ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>📄 Document Details</span>
              </h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-semibold px-2 py-1 rounded bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Filename:</span>
                <span className="font-semibold text-slate-200">{selectedDoc.filename}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Document ID:</span>
                <span className="font-mono text-[11px] text-indigo-400">{selectedDoc.fileId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">File Type:</span>
                <span className="uppercase font-mono text-[11px]">{selectedDoc.fileType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Total Size:</span>
                <span className="font-mono">{((selectedDoc.sizeBytes || 0) / 1024).toFixed(2)} KB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Page Count:</span>
                <span className="font-semibold">{selectedDoc.pageCount || 1} pages</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Semantic Chunks:</span>
                <span className="font-bold text-indigo-400">{selectedDoc.chunkCount || 0} chunks</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Vector Model:</span>
                <span className="font-mono text-emerald-400">sentence-transformers/all-MiniLM-L6-v2</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Upload Date:</span>
                <span>{selectedDoc.uploadedAt ? new Date(selectedDoc.uploadedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-full bg-rose-950 border border-rose-800/50">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-100">Delete Knowledge Document?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-100">"{confirmDeleteDoc.filename}"</strong>?
              This action will remove document metadata, <strong className="text-rose-400">{confirmDeleteDoc.chunkCount} semantic chunks</strong>, and all vector embeddings from Supabase pgvector.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteDoc(null)}
                disabled={deletingId === confirmDeleteDoc.fileId}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDelete(confirmDeleteDoc.fileId)}
                disabled={deletingId === confirmDeleteDoc.fileId}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {deletingId === confirmDeleteDoc.fileId ? 'Deleting from Supabase...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
