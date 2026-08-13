import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon } from './icons';

const EASE_CURVE = [0.22, 1, 0.36, 1] as const;

export function CTA() {
  // Cursor Parallax Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [2, -2]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-2, 2]), { stiffness: 150, damping: 20 });
  const translateX = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 20 });
  const translateY = useSpring(useTransform(y, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section id="cta" className="relative w-full py-24 sm:py-32 lg:py-40 bg-transparent font-sans select-none overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 flex justify-center">
        {/* Main CTA Card Container with Parallax & Spring entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            rotateX,
            rotateY,
            x: translateX,
            y: translateY,
            transformStyle: 'preserve-3d',
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full max-w-[900px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.06)_0%,rgba(17,17,17,0.95)_70%)] px-8 py-14 sm:px-16 sm:py-20 text-center shadow-[0_0_80px_rgba(255,255,255,0.03)] backdrop-blur-md"
        >
          {/* Subtle Inner Glow Accent */}
          <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

          {/* Inner Content Block */}
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE_CURVE }}
              className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.1] font-display"
            >
              Build smarter decisions with Enterprise Intelligence.
            </motion.h2>

            {/* Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE_CURVE }}
              className="mt-5 text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed"
            >
              Start with a secure workspace and add analytics, backtesting, and AI intelligence as your enterprise data grows.
            </motion.p>

            {/* Buttons Row */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35, ease: EASE_CURVE }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="w-full sm:w-auto">
                <Button
                  variant="default"
                  size="lg"
                  asChild
                  className="w-full sm:w-auto h-11 px-6 text-sm bg-zinc-50 text-zinc-950 hover:bg-white font-medium rounded-xl shadow-lg transition-all"
                >
                  <Link to="/signup">
                    Get Started
                    <ArrowRightIcon className="h-4 w-4 ml-2 inline-block" />
                  </Link>
                </Button>
              </motion.div>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full sm:w-auto h-11 px-6 text-sm border-white/10 bg-transparent text-zinc-200 hover:border-white/25 hover:bg-white/[0.04] font-medium rounded-xl transition-all"
              >
                <Link to="/signin">
                  Sign In
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
