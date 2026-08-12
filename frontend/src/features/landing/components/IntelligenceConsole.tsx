import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function IntelligenceConsole() {
  const [activeTick, setActiveTick] = useState(12480920);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTick((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Console Window Chrome */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-md overflow-hidden font-sans">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] font-semibold text-zinc-400 tracking-wider">
              PS-05 INTELLIGENCE CONSOLE
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
            <span>v2.4</span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-400">Live</span>
          </div>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Section 1: Backtesting Performance */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Strategy Backtest Performance
              </span>
              <span className="text-[10px] font-mono font-medium text-emerald-400">
                +18.42% CAGR
              </span>
            </div>

            {/* Sparkline Chart */}
            <div className="relative h-16 w-full">
              <svg viewBox="0 0 300 60" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
                    <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 50 C40 45, 70 30, 100 35 C130 40, 160 20, 200 22 C240 25, 270 10, 300 5 L300 60 L0 60 Z"
                  fill="url(#chartGrad)"
                />
                <motion.path
                  d="M0 50 C40 45, 70 30, 100 35 C130 40, 160 20, 200 22 C240 25, 270 10, 300 5"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
              </svg>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/40">
              <span>Sharpe: 2.14</span>
              <span>Max DD: -4.1%</span>
              <span>Win Rate: 68.4%</span>
            </div>
          </div>

          {/* Section 2: DataMart SQL Ingestion */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                DataMart Analytics Engine
              </span>
              <span className="text-[10px] font-mono text-cyan-400">DuckDB Columnar</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold font-mono text-zinc-100">
                {activeTick.toLocaleString()} rows
              </span>
              <span className="text-[10px] text-zinc-500">Latency: 14ms</span>
            </div>
          </div>

          {/* Section 3: Retail AI Assistant Output */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950 p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                Retail AI Assistant
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 italic">
              "Which segment drove the Q3 margin expansion?"
            </p>
            <div className="mt-2 rounded-md bg-zinc-900/80 border border-zinc-800 p-2.5">
              <p className="text-[11px] leading-relaxed text-zinc-200">
                <span className="text-cyan-400 font-bold mr-1">▪</span> Enterprise segment generated a <span className="text-emerald-400 font-semibold">+12.4% revenue shift</span>, confirmed by DuckDB transaction logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
