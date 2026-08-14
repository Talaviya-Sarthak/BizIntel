import { motion } from 'framer-motion';
import { FeaturesSectionWithHoverEffects } from '../../../components/ui/feature-section-with-hover-effects';

export function PlatformOverview() {
  return (
    <section id="capabilities" className="relative py-10 sm:py-14 border-t border-zinc-800/80">
      <div className="container-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
            Platform Capabilities
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-4xl font-display uppercase">
            Unified Analytics &amp; Intelligence Capabilities
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Engineered for quantitative research, business analytics, and generative decision-making in a single governed pipeline.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm overflow-hidden shadow-2xl"
        >
          <FeaturesSectionWithHoverEffects />
        </motion.div>
      </div>
    </section>
  );
}
