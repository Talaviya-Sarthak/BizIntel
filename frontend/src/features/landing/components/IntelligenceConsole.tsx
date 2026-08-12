import { useEffect, useState } from 'react';

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
      <div className="border-2 border-white bg-ink-card shadow-brutal overflow-hidden font-sans rounded-md">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-white bg-black px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime animate-pulse" />
            <span className="font-mono text-[10px] font-bold text-white tracking-wider uppercase">
              BizIntel-INTELLIGENCE CONSOLE
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted font-bold">
            <span>v2.4</span>
            <span className="text-white">|</span>
            <span className="text-lime bg-lime/10 px-1.5 py-0.5 border border-lime/30 rounded-sm">Live</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Section 1: Backtesting Performance */}
          <div className="border-2 border-white bg-black p-3.5 rounded-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Strategy Backtest Performance
              </span>
              <span className="text-[10px] font-mono font-bold text-lime uppercase">
                +18.42% CAGR
              </span>
            </div>

            {/* Sparkline Chart */}
            <div className="relative h-16 w-full bg-ink-card border border-white/10 rounded-sm overflow-hidden mt-1">
              <svg viewBox="0 0 300 60" className="h-full w-full" preserveAspectRatio="none">
                <path
                  d="M0 50 C40 45, 70 30, 100 35 C130 40, 160 20, 200 22 C240 25, 270 10, 300 5"
                  fill="none"
                  stroke="#C6FF00"
                  strokeWidth="2.5"
                  strokeLinecap="square"
                />
              </svg>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted pt-2 border-t border-white/20">
              <span>Sharpe: 2.14</span>
              <span>Max DD: -4.1%</span>
              <span>Win Rate: 68.4%</span>
            </div>
          </div>

          {/* Section 2: DataMart SQL Ingestion */}
          <div className="border-2 border-white bg-black p-3.5 rounded-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                DataMart Analytics Engine
              </span>
              <span className="text-[10px] font-mono text-pink font-bold uppercase">DuckDB Columnar</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold font-mono text-white">
                {activeTick.toLocaleString()} rows
              </span>
              <span className="text-[10px] text-muted font-bold">Latency: 14ms</span>
            </div>
          </div>

          {/* Section 3: Retail AI Assistant Output */}
          <div className="border-2 border-lime bg-black p-3.5 rounded-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="h-1.5 w-1.5 bg-lime" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-lime">
                Retail AI Assistant
              </span>
            </div>
            <p className="text-[11px] text-white italic font-medium">
              "Which segment drove the Q3 margin expansion?"
            </p>
            <div className="mt-2 rounded-sm bg-ink-card border border-white/20 p-2.5">
              <p className="text-[11px] leading-relaxed text-white">
                <span className="text-lime font-black mr-1">▪</span> Enterprise segment generated a <span className="text-lime font-bold uppercase tracking-wider">+12.4% revenue shift</span>, confirmed by DuckDB transaction logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
