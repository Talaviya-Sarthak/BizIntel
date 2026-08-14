import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';

export function CTA() {
  return (
    <section id="cta" className="relative py-10 sm:py-14 border-t border-zinc-800/80 overflow-hidden">
      {/* Ambient Radial Glow Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-b from-white/[0.04] via-zinc-400/[0.02] to-transparent blur-[130px] pointer-events-none rounded-full" />

      <div className="container-shell relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/80 px-6 py-10 sm:px-12 sm:py-14 text-center shadow-2xl backdrop-blur-xl max-w-[950px] mx-auto"
        >
          {/* Top Subtle Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md shadow-inner shadow-black/40 mb-6">
            <span className="flex h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span>Ready for Deployment</span>
          </div>

          <div className="relative max-w-[720px] mx-auto flex flex-col items-center">
            {/* Enterprise Metallic Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] select-none text-center">
              <span className="bg-[linear-gradient(180deg,#FFFFFF_0%,#E4E4E7_50%,#A1A1AA_100%)] bg-clip-text text-transparent block">
                Transform Data Into
              </span>
              <span className="bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F4F5_45%,#71717A_100%)] bg-clip-text text-transparent block mt-1">
                Competitive Intelligence
              </span>
            </h2>

            {/* Muted 2-line Description */}
            <p className="mt-5 sm:mt-6 text-sm sm:text-base leading-relaxed text-zinc-400 font-normal max-w-[580px] text-center">
              Start with a secure workspace and unify strategy backtesting, DataMart SQL analytics, and retail AI intelligence as your business grows.
            </p>

            {/* Action Buttons */}
            <div className="mt-9 sm:mt-11 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto h-11 px-7 text-xs sm:text-sm bg-white text-zinc-950 font-semibold hover:bg-zinc-200 rounded-xl transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group hover:-translate-y-0.5"
                >
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 px-7 text-xs sm:text-sm border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 font-medium rounded-xl transition-all duration-200 shadow-sm backdrop-blur-md hover:-translate-y-0.5"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust Indicators Section */}
            <div className="mt-14 pt-8 border-t border-zinc-800/60 w-full max-w-[620px] flex flex-wrap items-center justify-around gap-4 sm:gap-6 text-xs font-medium text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-semibold">✓</span>
                <span>Enterprise Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-semibold">✓</span>
                <span>Secure by Design</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-semibold">✓</span>
                <span>AI Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-semibold">✓</span>
                <span>Built for Scale</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

