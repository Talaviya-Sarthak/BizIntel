/**
 * Mock product visualization shown in the hero. Pure markup/SVG — no
 * charting library and no real data claims.
 */
export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden border-2 border-white bg-ink-card shadow-brutal rounded-md">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b-2 border-white bg-black px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-white" />
          </div>
          <span className="font-mono text-[10px] text-muted font-bold uppercase tracking-wider">workspace.intelligence</span>
          <span className="inline-flex items-center gap-1.5 border border-lime bg-lime/10 px-2 py-0.5 text-[9px] font-bold text-lime uppercase tracking-wider rounded-sm">
            <span className="h-1.5 w-1.5 bg-lime" />
            Live
          </span>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-40 shrink-0 flex-col gap-1.5 border-r-2 border-white bg-ink-soft p-3 sm:flex">
            <SidebarItem label="Overview" active />
            <SidebarItem label="Backtests" />
            <SidebarItem label="Datasets" />
            <SidebarItem label="AI Assistant" />
            <SidebarItem label="Settings" />
          </div>

          {/* Main panel */}
          <div className="min-w-0 flex-1 p-4 bg-black">
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Revenue" value="$4.8M" delta="+12.4%" />
              <KpiCard label="Datasets" value="128" delta="+8" />
              <KpiCard label="Insights" value="342" delta="+21.7%" />
            </div>

            <div className="mt-4 border-2 border-white bg-ink-card p-3.5 rounded-sm">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white">Revenue trend</span>
                <span className="font-mono text-[10px] text-muted font-bold">Q1 – Q4</span>
              </div>
              <RevenueChart />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="border-2 border-white bg-ink-card p-3.5 rounded-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-white">Strategy performance</span>
                <Bars />
              </div>
              <div className="border-2 border-lime bg-ink-card p-3.5 rounded-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-lime">AI Assistant</span>
                <p className="mt-2 text-[11px] leading-relaxed text-white italic">
                  Which dataset drove the largest revenue shift this quarter?
                </p>
                <div className="mt-3 rounded-sm border border-white/20 bg-black p-2.5">
                  <p className="text-[10px] leading-relaxed text-white">
                    <span className="text-lime font-black mr-1">▪</span> North America inventory drove a <span className="text-lime font-bold">+12.4% revenue shift</span>, led by the Enterprise segment.
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
      className={`flex items-center gap-2 px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-sm border ${
        active
          ? 'bg-lime text-black border-white'
          : 'text-muted border-transparent hover:text-white hover:bg-white/5'
      }`}
    >
      <span className="h-1.5 w-1.5 bg-current shrink-0" />
      {label}
    </div>
  );
}

function KpiCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="border-2 border-white bg-ink-card p-3 rounded-sm">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[9px] font-bold text-lime uppercase tracking-wider">{delta}</p>
    </div>
  );
}

function RevenueChart() {
  const line =
    'M0 90 C30 84 45 74 70 76 S110 58 140 60 S190 40 215 44 S260 30 290 22 S340 18 365 8';
  return (
    <svg viewBox="0 0 365 100" className="h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
      {[25, 50, 75].map((y) => (
        <line key={y} x1="0" x2="365" y1={y} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      <path d={line} fill="none" stroke="#C6FF00" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <circle cx="365" cy="8" r="3.5" fill="#C6FF00" />
    </svg>
  );
}

function Bars() {
  const heights = [42, 58, 38, 70, 52, 82, 60, 88];
  return (
    <div className="mt-4 flex h-14 items-end gap-2">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-pink border border-white rounded-none hover:bg-pink-dark transition-all"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
