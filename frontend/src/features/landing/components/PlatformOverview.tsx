import {
  ArrowUpRightIcon,
  DatabaseZapIcon,
  SparklesIcon,
  TrendingUpIcon,
} from './icons';

const CAPABILITIES = [
  {
    id: 'backtesting',
    icon: TrendingUpIcon,
    title: 'Backtesting',
    description:
      'Test strategies against historical data with rigorous, bias-controlled performance analysis.',
    points: ['Historical strategy execution', 'Look-ahead-bias prevention', 'Drawdown & benchmark comparison'],
  },
  {
    id: 'datamart',
    icon: DatabaseZapIcon,
    title: 'DataMart Analytics',
    description:
      'Transform transactional datasets into actionable business intelligence with industrial-grade processing.',
    points: ['Dataset ingestion & validation', 'DuckDB-powered SQL analytics', 'KPI generation & dashboards'],
  },
  {
    id: 'ai',
    icon: SparklesIcon,
    title: 'AI Assistant',
    description:
      'Ask questions about enterprise data in plain language and receive intelligent, explainable analytical insights.',
    points: ['Natural-language queries', 'Dataset-aware analysis', 'AI-generated recommendations'],
  },
] as const;

export function PlatformOverview() {
  return (
    <section id="capabilities" className="relative py-20 sm:py-28">
      <div className="container-shell">
        <div className="max-w-2xl">
          <span className="section-label">Platform Overview</span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Three capabilities. One intelligence layer.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            The platform converges quantitative research, business analytics, and
            generative intelligence into a single, auditable workflow.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {CAPABILITIES.map((capability, index) => (
            <div
              key={capability.id}
              id={capability.id === 'ai' ? 'ai' : undefined}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:border-cyan-400/30 hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
                  <capability.icon />
                </div>
                <span className="font-mono text-xs text-slate-600">0{index + 1}</span>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-white">{capability.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                {capability.description}
              </p>

              <ul className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5">
                {capability.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-cyan-400" />
                    {point}
                  </li>
                ))}
              </ul>

              <a
                href="#platform"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300 opacity-70 transition group-hover:opacity-100"
              >
                Learn more <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
