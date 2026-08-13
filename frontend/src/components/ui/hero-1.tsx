import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function Hero({
  eyebrow = "Next-Gen Productivity",
  title = "Build smarter tools for modern teams",
  subtitle = "Streamline your workflow and boost productivity with intuitive solutions. Security, speed, and simplicity—all in one platform.",
  ctaLabel = "Get Started",
  ctaHref = "/signup",
}: HeroProps) {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-transparent text-zinc-50 pt-28 sm:pt-36 lg:pt-40 pb-24 sm:pb-32 flex flex-col items-center text-center font-sans select-none"
    >

      {/* Content Container (Stacked Centered Single-Column) */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 text-center">
        {/* Badge Pill */}
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 sm:mb-8"
          >
            <a href="#" className="group inline-block">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-1.5 text-[13px] sm:text-sm font-medium tracking-wider text-zinc-300 uppercase shadow-[0_0_20px_rgba(255,255,255,0.03)] transition-colors duration-200 group-hover:border-white/25">
                {eyebrow}
                <ChevronRight className="inline w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1 text-zinc-400" />
              </span>
            </a>
          </motion.div>
        )}

        {/* Large Embossed Metallic Gradient Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-bold text-5xl sm:text-7xl md:text-8xl lg:text-[92px] tracking-tighter leading-[0.95] max-w-5xl text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 select-none"
        >
          {title}
        </motion.h1>

        {/* Single-Line Scannable Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl font-normal text-zinc-400 max-w-2xl leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* Primary CTA Button */}
        {ctaLabel && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 sm:mt-10"
          >
            <Button
              asChild
              className="h-12 px-7 bg-zinc-100 text-zinc-950 hover:bg-white font-medium text-base sm:text-lg rounded-lg shadow-xl transition-all duration-200 hover:scale-[1.02]"
            >
              <a href={ctaHref}>{ctaLabel}</a>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default Hero;
