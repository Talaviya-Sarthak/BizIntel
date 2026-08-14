import { motion } from 'framer-motion';
import EnterpriseAIPipeline from '../../../components/ui/ai-agent-pipeline';

export function Architecture() {
  return (
    <section id="architecture" className="relative py-10 sm:py-14 border-t border-zinc-800/80">
      <div className="container-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
              Enterprise Architecture
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-4xl font-display uppercase">
              A layered pipeline built for scale
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              From raw enterprise data to business decisions, each layer is a
              clean, replaceable module. The platform composes them into one
              governed intelligence pipeline.
            </p>

            <div className="mt-6 space-y-2.5">
              {['Decoupled, modular services', 'Versioned REST API', 'Schema-managed database', 'Extensible by design'].map(
                (point) => (
                  <div key={point} className="flex items-center gap-2.5 text-xs text-zinc-300">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[9px] font-bold text-zinc-300 border border-zinc-700">
                      ✓
                    </span>
                    {point}
                  </div>
                ),
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex justify-center"
          >
            <EnterpriseAIPipeline />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
