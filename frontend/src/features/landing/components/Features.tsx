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
    description: 'JWT authentication, credentials encryption, and validated API boundaries.',
  },
  {
    icon: ServerIcon,
    title: 'Scalable infrastructure',
    description: 'Serverless PostgreSQL and a modular API built to grow with the platform.',
  },
] as const;

export function Features() {
  return (
    <section id="features" className="relative py-16 sm:py-24 border-t-2 border-white bg-black">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-label">
            Capabilities
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl uppercase">
            Built for the demands of enterprise analytics
          </h2>
          <p className="mt-2 text-sm font-bold uppercase tracking-wider text-muted">
            Every capability is designed to be modular, auditable, and ready to integrate with the rest of the platform.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group border-2 border-white bg-ink-card p-5 shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-brutal-press transition-all duration-150 rounded-md"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center border-2 border-lime bg-lime/10 text-lime transition-all">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-white">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
