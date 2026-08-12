import React, { useEffect, useState } from 'react';
import { fetchSystemHealth, fetchSystemMetrics } from '../api/system.api';
import { useThemeStore } from '../store/useThemeStore';
import type { SystemHealth, SystemMetrics } from '../types/ai.types';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSystemInfo = async () => {
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

    loadSystemInfo();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">⚙️ Enterprise Settings & System Health</h1>
        <p className="text-xs text-slate-400">
          Configure application preferences and inspect real-time platform observability metrics
        </p>
      </div>

      {/* Theme Settings Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 mb-2">Appearance & Theme</h3>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Interface Mode: <strong className="text-slate-200 capitalize">{theme}</strong></span>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      {/* System Health Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <span>🩺 Subsystem Health Overview</span>
          {health && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              {health.status}
            </span>
          )}
        </h3>

        {loading ? (
          <div className="text-xs text-slate-400 animate-pulse py-2">Loading system telemetry...</div>
        ) : health ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {Object.entries(health.services).map(([svc, status]) => (
              <div key={svc} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px] uppercase font-mono">{svc}</div>
                <div className="text-emerald-400 font-bold mt-1">{status}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500">System health telemetry unavailable.</div>
        )}
      </div>

      {/* Real-time Metrics Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 mb-3">📈 Enterprise Telemetry & Metrics</h3>
        {metrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Memory Sessions</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{metrics.metrics.memorySessions}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Memory Messages</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{metrics.metrics.memoryMessages}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Vector Chunks</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{metrics.metrics.vectorStoreChunks}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Vector Documents</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{metrics.metrics.vectorStoreDocuments}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Active Jobs</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">{metrics.metrics.activeJobsCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400">Heap Used</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">
                {(metrics.processMemory.heapUsed / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">Telemetry metrics unavailable.</div>
        )}
      </div>

      {/* Model & Platform Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm text-xs space-y-2">
        <h3 className="text-sm font-bold text-slate-200">🤖 AI Execution Engine Configuration</h3>
        <div className="text-slate-400">Primary LLM Model: <strong className="text-slate-200 font-mono">llama-3.3-70b-versatile (Groq API)</strong></div>
        <div className="text-slate-400">Vector Embeddings: <strong className="text-slate-200 font-mono">384-dimensional feature hypersphere</strong></div>
        <div className="text-slate-400">Platform Version: <strong className="text-slate-200 font-mono">v0.1.0 (PS-05 Production Edition)</strong></div>
      </div>
    </div>
  );
};
