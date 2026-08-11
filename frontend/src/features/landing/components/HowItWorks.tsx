import { DatabaseIcon, BarChartIcon, SparklesIcon, TargetIcon } from './icons';

const STEPS = [
  {
    icon: DatabaseIcon,
    step: '01',
    title: 'Connect Data',
    description: 'Bring enterprise datasets into a validated, governed workspace.',
  },
  {
    icon: BarChartIcon,
    step: '02',
    title: 'Analyze',
    description: 'Run SQL analytics, dashboards, and strategy backtests on clean data.',
  },
  {
    icon: SparklesIcon,
    step: '03',
    title: 'Generate Insights',
    description: 'Surface AI-powered explanations, recommendations, and anomalies.',
  },
  {
    icon: TargetIcon,
    step: '04',
    title: 'Make Decisions',
    description: 'Act with confidence on evidence-backed intelligence.',
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-label">How It Works</span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From raw data to confident decisions
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            A clear, repeatable pipeline designed to fit existing enterprise
            workflows.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((item, index) => (
            <div key={item.step} className="relative flex flex-col items-start">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/25">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs text-slate-500">{item.step}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {item.description}
              </p>

              {index < STEPS.length - 1 ? (
                <svg
                  className="absolute -right-2 top-5 hidden h-4 w-4 text-slate-600 lg:block"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M3 8h10m0 0-3.5-3.5M13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
