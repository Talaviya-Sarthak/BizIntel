import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';
import { IntelligenceConsole } from './IntelligenceConsole';

export function Hero() {
  return (
    <section id="platform" className="relative pb-16 pt-24 sm:pb-24 sm:pt-32">
      <div className="container-shell">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left Column: Refined 3-Word Typographic Headline & Copy */}
          <div className="flex flex-col items-start text-left">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                PS-05 Enterprise Intelligence Platform
              </span>
            </motion.div>

            {/* 3-Word Typographic Composition with Brand Cyan Accent */}
            <div className="mt-5 flex flex-col items-start leading-none select-none">
              {/* Word 1: DATA */}
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-2xl sm:text-3xl tracking-widest text-zinc-400 font-bold uppercase"
              >
                DATA
              </motion.span>

              {/* Word 2: INTELLIGENCE (Brand Cyan Accent & Anchored Size) */}
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-cyan-400 leading-none my-1"
              >
                INTELLIGENCE
              </motion.span>

              {/* Word 3: DECISIONS */}
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-2xl sm:text-3xl tracking-widest text-zinc-100 font-bold uppercase"
              >
                DECISIONS
              </motion.span>
            </div>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm"
            >
              A unified enterprise intelligence layer combining quantitative strategy backtesting, DataMart SQL analytics, and retail AI decision support.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Link to="/signup">
                <Button variant="default" size="lg" className="h-9.5 text-xs px-4 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-medium rounded-lg">
                  Get Started
                  <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
              <a href="#capabilities">
                <Button variant="outline" size="lg" className="h-9.5 text-xs px-4 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 font-medium rounded-lg">
                  Explore Capabilities
                </Button>
              </a>
            </motion.div>
          </div>

          {/* Right Column: Product Intelligence Console */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex justify-center lg:justify-end"
          >
            <IntelligenceConsole />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
