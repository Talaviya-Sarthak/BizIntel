import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatasetUploader } from '../features/datasets/components/DatasetUploader';
import { datasetService } from '../features/datasets/services/dataset.service';
import type { Dataset } from '../features/datasets/types';

export const UploadCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const res = await datasetService.listDatasets();
      setDatasets(res.datasets || []);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span>📤 Enterprise Upload Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
              DuckDB Dataset Engine
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            Upload CSV datasets for high-speed DuckDB analytics, schema profiling, statistical analysis, and interactive charting.
          </p>
        </div>

        <button
          onClick={loadDatasets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 transition-all shadow-sm self-start sm:self-auto disabled:opacity-50 active:scale-95"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-zinc-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Registry'}</span>
        </button>
      </div>

      {/* Dataset Uploader Component (CSV Dataset Pipeline) */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Upload New Dataset</h2>
        <DatasetUploader
          onUploaded={(dataset: Dataset) => {
            loadDatasets();
            navigate(`/datasets/${dataset.id}/analysis`);
          }}
        />
      </div>

      {/* Uploaded Datasets Registry List */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#121214] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📊 Dataset Registry</span>
            <span className="text-xs font-mono font-normal text-zinc-400">({datasets.length} registered datasets)</span>
          </h3>
        </div>

        {loading ? (
          /* Skeleton Loader List */
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-zinc-800 rounded w-3/4"></div>
                    <div className="h-2 bg-zinc-800/60 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-3 bg-zinc-800 rounded w-1/6"></div>
                <div className="h-6 bg-zinc-800 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : datasets.length === 0 ? (
          /* Empty State */
          <div className="py-12 text-center space-y-3 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <div className="inline-flex p-3 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-zinc-200">No datasets uploaded yet</div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Upload a CSV dataset above to validate, profile with DuckDB, and start visual analytics.
            </p>
          </div>
        ) : (
          /* Registered Datasets List */
          <div className="space-y-3">
            {datasets.map((ds) => (
              <div
                key={ds.id}
                className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs hover:bg-zinc-900/90 transition-all"
              >
                <div className="flex items-center gap-3.5 truncate">
                  <span className="p-2 rounded-xl text-[10px] font-bold font-mono border bg-zinc-900 text-emerald-300 border-emerald-800/40">
                    📊 CSV
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-zinc-100 truncate">{ds.name}</div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {ds.rowCount ? ds.rowCount.toLocaleString() : '—'} rows • {ds.columnCount || '—'} columns • {ds.fileSize ? (ds.fileSize / 1024).toFixed(1) + ' KB' : '—'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                    <span>✓</span>
                    <span>{ds.status || 'READY'}</span>
                  </span>

                  <button
                    onClick={() => navigate(`/datasets/${ds.id}/analysis`)}
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-[11px] transition-colors shadow-sm"
                  >
                    Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
