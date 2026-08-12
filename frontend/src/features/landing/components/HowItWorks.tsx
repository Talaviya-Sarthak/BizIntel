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
    <section id="how-it-works" className="relative py-16 sm:py-24 border-t-2 border-white bg-black">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="section-label">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl uppercase">
            From raw data to confident decisions
          </h2>
          <p className="mt-2 text-sm font-bold uppercase tracking-wider text-muted">
            A clear, repeatable pipeline designed to fit existing enterprise workflows.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, index) => (
            <div
              key={item.step}
              className="relative flex flex-col border-2 border-white bg-ink-card p-6 shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-brutal-press transition-all duration-150 rounded-md"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center border-2 border-lime bg-lime/10 text-lime">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-sm text-pink font-black">{item.step}</span>
              </div>
              <h3 className="mt-5 text-base font-black uppercase text-white">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted font-medium">
                {item.description}
              </p>

              {index < STEPS.length - 1 ? (
                <svg
                  className="absolute -right-3.5 top-1/2 -translate-y-1/2 hidden h-5 w-5 text-white lg:block z-10"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M3 8h10m0 0-3.5-3.5M13 8l-3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
