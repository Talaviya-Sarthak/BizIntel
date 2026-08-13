import { motion } from 'framer-motion';
import { Database, LineChart, Cpu, CheckCircle2 } from 'lucide-react';

interface StepItem {
  step: string;
  title: string;
  description: string;
  icon: typeof Database;
  bgClass: string;
  borderClass: string;
}

const STEPS: StepItem[] = [
  {
    step: '01',
    title: 'Connect Data',
    description: 'Ingest enterprise data sources into a secure, schema-validated analytics pipeline.',
    icon: Database,
    bgClass: 'bg-[#111111]',
    borderClass: 'border-white/[0.08]',
  },
  {
    step: '02',
    title: 'Run Analytics',
    description: 'Execute high-performance SQL queries, strategy backtests, and custom data models.',
    icon: LineChart,
    bgClass: 'bg-[#121212]',
    borderClass: 'border-white/[0.09]',
  },
  {
    step: '03',
    title: 'AI Synthesis',
    description: 'Surface automated explanations, anomaly flags, and actionable predictive metrics.',
    icon: Cpu,
    bgClass: 'bg-[#141414]',
    borderClass: 'border-white/[0.11]',
  },
  {
    step: '04',
    title: 'Decide & Act',
    description: 'Convert verified intelligence into operational strategies and executive decisions.',
    icon: CheckCircle2,
    bgClass: 'bg-[#161616]',
    borderClass: 'border-white/[0.14]',
  },
];

const EASE_CURVE = [0.22, 1, 0.36, 1] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative w-full py-20 sm:py-28 lg:py-32 border-t border-white/[0.08] bg-transparent text-zinc-50 font-sans select-none overflow-hidden"
    >
      {/* Slow Floating Grid Background */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 -z-10 opacity-30 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_75%_50%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none"
      />

      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Header Block with Staggered Entrance */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="flex flex-col items-center text-center"
        >
          {/* Badge Pill */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 24 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CURVE } },
            }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-zinc-300">
              How it Works
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 24 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CURVE } },
            }}
            className="mt-5 text-3xl sm:text-5xl lg:text-[52px] font-bold text-white tracking-tight leading-[1.08] font-display max-w-3xl"
          >
            From Raw Data
            <br />
            to Trusted Decisions
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 24 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_CURVE } },
            }}
            className="mt-4 text-sm sm:text-base text-zinc-400 max-w-[580px] leading-relaxed"
          >
            Transform fragmented enterprise data into reliable insights through a transparent, AI-assisted workflow.
          </motion.p>
        </motion.div>

        {/* 4-Card Grid with Staggered Entrance & Connected Workflow */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 relative">
          {/* Connecting Progress Line (Desktop) */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            style={{ transformOrigin: 'left' }}
            transition={{ duration: 0.4, delay: 0.4, ease: EASE_CURVE }}
            className="hidden lg:block absolute top-[40px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0 pointer-events-none"
          />

          {STEPS.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 32, scale: 0.98, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                whileHover={{ scale: 1.015, y: -4 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.12,
                  ease: EASE_CURVE,
                  scale: { duration: 0.25, ease: EASE_CURVE },
                  y: { duration: 0.25, ease: EASE_CURVE },
                }}
                className={`group relative z-10 flex flex-col justify-between rounded-xl border ${item.borderClass} ${item.bgClass} p-5 sm:p-6 min-h-[220px] shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-white/25 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-colors duration-250`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    {/* Icon Container */}
                    <motion.div
                      variants={{
                        rest: { rotate: 0, scale: 1 },
                        hover: { rotate: 5, scale: 1.05 },
                      }}
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        type: 'spring',
                        stiffness: 120,
                        damping: 20,
                        delay: index * 0.12 + 0.1,
                      }}
                      className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300 group-hover:bg-white/[0.08] group-hover:text-white group-hover:border-white/20 transition-all duration-250"
                    >
                      <Icon className="w-5 h-5 stroke-[1.8]" />
                    </motion.div>

                    {/* Step Number */}
                    <motion.span
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 0.35, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.12 + 0.15, ease: EASE_CURVE }}
                      className="font-mono text-xs font-semibold text-white tracking-widest group-hover:opacity-100 transition-opacity duration-250"
                    >
                      {item.step}
                    </motion.span>
                  </div>

                  {/* Card Title */}
                  <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 tracking-tight mt-4 group-hover:text-white group-hover:tracking-normal transition-all duration-250 font-display">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed group-hover:text-zinc-300 transition-colors duration-250">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
