import { motion } from 'framer-motion';
import { DatabaseIcon, BarChartIcon, SparklesIcon, TargetIcon } from './icons';
import {
  TextShift,
  FadeLift,
  StaggerGroup,
  StaggerItem,
  ScrubProgress,
} from '../../../components/motion';

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
    <section id="how-it-works" className="relative py-12 sm:py-16 border-t border-zinc-800/80 overflow-hidden">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <FadeLift delay={0} distance={16} duration={0.5}>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
              How It Works
            </span>
          </FadeLift>

          <TextShift
            direction="up"
            distance={18}
            duration={0.65}
            delay={0.1}
            as="h2"
            className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-4xl font-display uppercase"
          >
            From raw data to confident decisions
          </TextShift>

          <FadeLift delay={0.2} distance={16} duration={0.55}>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              A clear, repeatable pipeline designed to fit existing enterprise workflows.
            </p>
          </FadeLift>
        </div>

        {/* Scrubbed Horizontal Connector Bar on Desktop */}
        <div className="relative mt-12">
          <div className="hidden lg:block absolute top-[2.25rem] left-8 right-8 z-0">
            <ScrubProgress
              barClassName="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
              className="h-[2px] bg-zinc-800/60 rounded-full"
            />
          </div>

          <StaggerGroup
            staggerDelay={0.12}
            initialDelay={0.1}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-10"
          >
            {STEPS.map((item, index) => (
              <StaggerItem key={item.step}>
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
                  className="relative flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm p-5 hover:border-emerald-500/40 hover:bg-zinc-900/90 transition-colors duration-300 group shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700/60 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="font-mono text-xs text-zinc-500 font-semibold group-hover:text-emerald-400 transition-colors">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                    {item.description}
                  </p>

                  {index < STEPS.length - 1 ? (
                    <svg
                      className="absolute -right-2.5 top-1/2 -translate-y-1/2 hidden h-4 w-4 text-zinc-700 lg:block z-20 group-hover:text-emerald-400 transition-colors"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8h10m0 0-3.5-3.5M13 8l-3.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
