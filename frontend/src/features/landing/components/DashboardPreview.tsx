/**
 * Mock product visualization shown in the hero. Pure markup/SVG — no
 * charting library and no real data claims.
 */
export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-x-8 -top-8 bottom-0 rounded-3xl bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated/80 shadow-2xl shadow-black/50 backdrop-blur">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-white/15" />
            <span className="h-3 w-3 rounded-full bg-white/15" />
            <span className="h-3 w-3 rounded-full bg-white/15" />
          </div>
          <span className="font-mono text-xs text-slate-500">workspace.intelligence</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Live
          </span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-white/10 p-4 sm:flex">
            <SidebarItem label="Overview" active />
            <SidebarItem label="Backtests" />
            <SidebarItem label="Datasets" />
            <SidebarItem label="AI Assistant" />
            <SidebarItem label="Settings" />
          </div>

          {/* Main panel */}
          <div className="min-w-0 flex-1 p-5">
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Revenue" value="$4.8M" delta="+12.4%" />
              <KpiCard label="Datasets" value="128" delta="+8" />
              <KpiCard label="Insights" value="342" delta="+21.7%" />
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Revenue trend</span>
                <span className="font-mono text-[10px] text-slate-500">Q1 – Q4</span>
              </div>
              <RevenueChart />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <span className="text-xs font-semibold text-slate-300">Strategy performance</span>
                <Bars />
              </div>
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4">
                <span className="text-xs font-semibold text-cyan-300">AI Assistant</span>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Which dataset drove the largest revenue shift this quarter?
                </p>
                <div className="mt-3 rounded-lg border border-white/10 bg-surface-deep/60 p-3">
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    <span className="text-cyan-400">▪</span> North America inventory drove a
                    +12.4% revenue shift, led by the Enterprise segment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium ${
        active
          ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20'
          : 'text-slate-400'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {label}
    </div>
  );
}

function KpiCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white sm:text-base">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium text-cyan-400">{delta}</p>
    </div>
  );
}

function RevenueChart() {
  const line =
    'M0 90 C30 84 45 74 70 76 S110 58 140 60 S190 40 215 44 S260 30 290 22 S340 18 365 8';
  return (
    <svg viewBox="0 0 365 100" className="h-24 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((y) => (
        <line key={y} x1="0" x2="365" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      <path d={`${line} L365 100 L0 100 Z`} fill="url(#heroArea)" />
      <path d={line} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
      <circle cx="365" cy="8" r="3" fill="#22d3ee" />
    </svg>
  );
}

function Bars() {
  const heights = [42, 58, 38, 70, 52, 82, 60, 88];
  return (
    <div className="mt-3 flex h-16 items-end gap-2">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-500/30 to-cyan-400/70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
