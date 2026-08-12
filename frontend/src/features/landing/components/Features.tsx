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
    <section id="features" className="relative py-16 sm:py-24 border-t border-zinc-800/80">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
            Capabilities
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            Built for the demands of enterprise analytics
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Every capability is designed to be modular, auditable, and ready to
            integrate with the rest of the platform.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4.5 transition duration-200 hover:border-zinc-700 hover:bg-zinc-900/60"
            >
              <div className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition group-hover:text-zinc-100">
                <feature.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-3.5 text-xs font-semibold text-zinc-100">{feature.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
