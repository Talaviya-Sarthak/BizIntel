import { motion } from 'framer-motion';
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
    <section id="how-it-works" className="relative py-10 sm:py-14 border-t border-zinc-800/80">
      <div className="container-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
            How It Works
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-4xl font-display uppercase">
            From raw data to confident decisions
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            A clear, repeatable pipeline designed to fit existing enterprise
            workflows.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 hover:border-zinc-700 transition duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/60">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="font-mono text-xs text-zinc-500 font-semibold">{item.step}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-100">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                {item.description}
              </p>

              {index < STEPS.length - 1 ? (
                <svg
                  className="absolute -right-2.5 top-1/2 -translate-y-1/2 hidden h-4 w-4 text-zinc-700 lg:block z-10"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M3 8h10m0 0-3.5-3.5M13 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
