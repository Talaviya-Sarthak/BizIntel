import {
  DatabaseIcon,
  DatabaseZapIcon,
  LayersIcon,
  SparklesIcon,
  TargetIcon,
} from './icons';

const LAYERS = [
  {
    icon: DatabaseIcon,
    title: 'Enterprise Data',
    description: 'Transactional datasets and historical market data, persisted in Neon PostgreSQL.',
  },
  {
    icon: DatabaseZapIcon,
    title: 'Data Processing',
    description: 'Validation, cleaning, and analytical processing with DuckDB.',
  },
  {
    icon: LayersIcon,
    title: 'Analytics Engine',
    description: 'SQL analytics, KPI generation, dashboards, and strategy backtesting.',
  },
  {
    icon: SparklesIcon,
    title: 'AI Intelligence',
    description: 'Dataset-aware natural-language analysis and explainable recommendations.',
  },
  {
    icon: TargetIcon,
    title: 'Business Decisions',
    description: 'A single source of evidence for confident, auditable action.',
  },
] as const;

export function Architecture() {
  return (
    <section id="architecture" className="relative py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="container-shell">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <span className="section-label">Enterprise Architecture</span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              A layered pipeline built for scale
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              From raw enterprise data to business decisions, each layer is a
              clean, replaceable module. The platform composes them into one
              governed intelligence pipeline.
            </p>

            <div className="mt-8 space-y-3">
              {['Decoupled, modular services', 'Versioned REST API', 'Schema-managed database', 'Extensible by design'].map(
                (point) => (
                  <div key={point} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/10 text-[10px] font-bold text-cyan-400 ring-1 ring-cyan-400/25">
                      ✓
                    </span>
                    {point}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute bottom-6 left-[27px] top-6 w-px bg-gradient-to-b from-cyan-400/40 via-white/15 to-transparent" aria-hidden="true" />
            <div className="flex flex-col gap-3">
              {LAYERS.map((layer, index) => (
                <div
                  key={layer.title}
                  className={`relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-300 hover:border-cyan-400/25 ${
                    index === LAYERS.length - 1 ? 'border-cyan-400/30 bg-cyan-400/[0.05]' : ''
                  }`}
                >
                  <div className="relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-deep text-cyan-400 ring-1 ring-cyan-400/30">
                    <layer.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">{layer.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {layer.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
