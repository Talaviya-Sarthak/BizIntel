import React, { useEffect, useState } from 'react';
import { fetchSystemHealth, fetchSystemMetrics } from '../api/system.api';
import { useThemeStore } from '../store/useThemeStore';
import type { SystemHealth, SystemMetrics } from '../types/ai.types';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSystemInfo = async () => {
    setLoading(true);
    try {
      const [hData, mData] = await Promise.all([fetchSystemHealth(), fetchSystemMetrics()]);
      setHealth(hData);
      setMetrics(mData);
    } catch (err) {
      // Error fetching health metrics
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemInfo();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span>⚙️ Settings & System Health</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
              Observability Center
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            Configure application preferences, monitor real-time system telemetry, and inspect RAG engine status.
          </p>
        </div>

        <button
          onClick={loadSystemInfo}
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
          <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
        </button>
      </div>

      {/* Theme Settings Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#121214] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🎨 Appearance & Theme Preferences</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Customize visual theme and interface styling</p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 font-semibold uppercase">
            {theme} mode
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
          <span className="text-zinc-300">Toggle system interface theme between dark and light mode:</span>
          <button
            onClick={toggleTheme}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-colors shadow-sm active:scale-95"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
          </button>
        </div>
      </div>

      {/* Subsystem Health Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#121214] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
            <span>🩺 Subsystem Health Overview</span>
            {health && (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{health.status.toUpperCase()}</span>
              </span>
            )}
          </h3>

          <span className="text-xs text-zinc-500 font-mono">Live Status Check</span>
        </div>

        {loading ? (
          <div className="text-xs text-zinc-400 animate-pulse py-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Loading system telemetry & node health...</span>
          </div>
        ) : health ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {Object.entries(health.services).map(([svc, status]) => (
              <div key={svc} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <div className="text-zinc-400 text-[10px] font-bold uppercase font-mono tracking-wider">{svc}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-white font-semibold capitalize text-xs">{svc}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                    ✓ {status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-zinc-500 py-3">System health telemetry unavailable.</div>
        )}
      </div>

      {/* Real-time Metrics Card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#121214] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>📈 Real-Time Platform Telemetry</span>
        </h3>

        {metrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 text-xs font-medium">Memory Sessions</div>
              <div className="text-2xl font-bold text-white font-mono">{metrics.metrics.memorySessions}</div>
              <div className="text-[10px] text-zinc-500">Active chat conversations</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 text-xs font-medium">Memory Messages</div>
              <div className="text-2xl font-bold text-white font-mono">{metrics.metrics.memoryMessages}</div>
              <div className="text-[10px] text-zinc-500">Stored conversation turns</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 text-xs font-medium">Vector Chunks</div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">{metrics.metrics.vectorStoreChunks}</div>
              <div className="text-[10px] text-zinc-500">Indexed RAG vectors</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 text-xs font-medium">Vector Documents</div>
              <div className="text-2xl font-bold text-zinc-100 font-mono">{metrics.metrics.vectorStoreDocuments}</div>
              <div className="text-[10px] text-zinc-500">Stored knowledge files</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 text-xs font-medium">Active Jobs</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{metrics.metrics.activeJobsCount}</div>
              <div className="text-[10px] text-zinc-500">Background workers</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="text-zinc-400 text-xs font-medium">Node Heap Used</div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {(metrics.processMemory.heapUsed / (1024 * 1024)).toFixed(1)} MB
              </div>
              <div className="text-[10px] text-zinc-500">Runtime memory allocation</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 py-3">Telemetry metrics unavailable.</div>
        )}
      </div>

      {/* Model & Platform Info */}
      <div className="rounded-2xl border border-zinc-800/90 bg-[#121214] p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>🤖 AI Execution Engine & Infrastructure Specs</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Primary LLM Model</span>
            <strong className="text-zinc-200 font-mono text-xs mt-1 block truncate">llama-3.3-70b-versatile (Groq API)</strong>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Vector Embeddings</span>
            <strong className="text-zinc-200 font-mono text-xs mt-1 block truncate">384-dim hypersphere (all-MiniLM-L6-v2)</strong>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono">Platform Edition</span>
            <strong className="text-zinc-200 font-mono text-xs mt-1 block truncate">v0.1.0 (PS-05 Enterprise Platform)</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

