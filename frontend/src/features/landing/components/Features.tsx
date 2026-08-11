import {
  BarChartIcon,
  DatabaseIcon,
  LayersIcon,
  ServerIcon,
  ShieldIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
} from './icons';

const FEATURES = [
  {
    icon: LayersIcon,
    title: 'Unified analytics',
    description: 'One workspace for quantitative research, BI, and AI — no tool sprawl.',
  },
  {
    icon: TargetIcon,
    title: 'Data-driven decisions',
    description: 'Decisions grounded in evidence, metrics, and reproducible analysis.',
  },
  {
    icon: BarChartIcon,
    title: 'Interactive dashboards',
    description: 'Explore KPIs and drill into datasets with responsive, live views.',
  },
  {
    icon: TrendingUpIcon,
    title: 'Strategy backtesting',
    description: 'Validate strategies against history with bias-aware methodology.',
  },
  {
    icon: DatabaseIcon,
    title: 'Enterprise datasets',
    description: 'Ingest and validate transactional data at scale for analysis.',
  },
  {
    icon: SparklesIcon,
    title: 'AI-powered analysis',
    description: 'Ask questions in natural language and get explainable answers.',
  },
  {
    icon: ShieldIcon,
    title: 'Secure architecture',
    description: 'JWT authentication, hashed credentials, and validated API boundaries.',
  },
  {
    icon: ServerIcon,
    title: 'Scalable infrastructure',
    description: 'Serverless PostgreSQL and a modular API built to grow with the platform.',
  },
] as const;

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </div>

      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-label">Capabilities</span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for the demands of enterprise analytics
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Every capability is designed to be modular, auditable, and ready to
            integrate with the rest of the platform.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition duration-300 hover:border-cyan-400/25 hover:bg-white/[0.04]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-cyan-400 ring-1 ring-white/10 transition group-hover:bg-cyan-400/10 group-hover:ring-cyan-400/25">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
