/**
 * Mock product visualization shown in the hero. Pure markup/SVG — no
 * charting library and no real data claims.
 */
export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-sm">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
          </div>
          <span className="font-mono text-[11px] text-zinc-500">workspace.intelligence</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-40 shrink-0 flex-col gap-1 border-r border-zinc-800/80 bg-zinc-950/40 p-3 sm:flex">
            <SidebarItem label="Overview" active />
            <SidebarItem label="Backtests" />
            <SidebarItem label="Datasets" />
            <SidebarItem label="AI Assistant" />
            <SidebarItem label="Settings" />
          </div>

          {/* Main panel */}
          <div className="min-w-0 flex-1 p-4">
            <div className="grid grid-cols-3 gap-2.5">
              <KpiCard label="Revenue" value="$4.8M" delta="+12.4%" />
              <KpiCard label="Datasets" value="128" delta="+8" />
              <KpiCard label="Insights" value="342" delta="+21.7%" />
            </div>

            <div className="mt-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Revenue trend</span>
                <span className="font-mono text-[10px] text-zinc-500">Q1 – Q4</span>
              </div>
              <RevenueChart />
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3.5">
                <span className="text-xs font-semibold text-zinc-300">Strategy performance</span>
                <Bars />
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3.5">
                <span className="text-xs font-semibold text-zinc-200">AI Assistant</span>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  Which dataset drove the largest revenue shift this quarter?
                </p>
                <div className="mt-2.5 rounded-md border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                  <p className="text-[11px] leading-relaxed text-zinc-300">
                    <span className="text-cyan-400 mr-1">▪</span> North America inventory drove a
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
          ? 'bg-zinc-800 text-zinc-100'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {label}
    </div>
  );
}

function KpiCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-zinc-100 sm:text-base">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium text-emerald-400">{delta}</p>
    </div>
  );
}

function RevenueChart() {
  const line =
    'M0 90 C30 84 45 74 70 76 S110 58 140 60 S190 40 215 44 S260 30 290 22 S340 18 365 8';
  return (
    <svg viewBox="0 0 365 100" className="h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((y) => (
        <line key={y} x1="0" x2="365" y1={y} y2={y} stroke="#27272a" strokeWidth="1" />
      ))}
      <path d={`${line} L365 100 L0 100 Z`} fill="url(#heroArea)" />
      <path d={line} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="365" cy="8" r="2.5" fill="#22d3ee" />
    </svg>
  );
}

function Bars() {
  const heights = [42, 58, 38, 70, 52, 82, 60, 88];
  return (
    <div className="mt-3 flex h-14 items-end gap-1.5">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-zinc-700/60 hover:bg-zinc-600 transition-colors"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
