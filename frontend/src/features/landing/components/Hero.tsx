import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';
import {
  TextShift,
  FadeLift,
  MagneticButton,
  StaggerGroup,
  StaggerItem,
} from '../../../components/motion';
import { ChevronDown, ShieldCheck, Database, Sparkles } from 'lucide-react';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress across the hero section (220vh total height)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Deep immersive zoom-in directly toward the center of the image on scroll
  const imageScale = useTransform(scrollYProgress, [0, 0.85], [1, 1.75]);

  // Foreground text expands outward and dissolves as camera moves forward into the scene
  const contentOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.28], [0, -50]);
  const contentScale = useTransform(scrollYProgress, [0, 0.28], [1, 1.08]);

  // Fade out scroll indicator on initial scroll
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  const handleScrollDown = () => {
    const el = document.getElementById('capabilities');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      id="platform"
      className="relative h-[220vh] w-full bg-[#090a0f]"
    >
      {/* Sticky Fullscreen Hero Viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden">
        {/* 1. Cinematic Background Image Layer with Zoom in toward Image on Scroll */}
        <motion.div
          style={{ scale: imageScale, transformOrigin: '50% 50%' }}
          className="absolute inset-0 z-0 origin-center will-change-transform"
        >
          <img
            src="/brand/bizintel_cinematic_hero.jpg"
            alt="BizIntel Enterprise Intelligence Architecture"
            className="size-full object-cover object-center"
          />
          {/* Subtle cinematic gradient overlays for contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f]/90 via-black/25 to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
        </motion.div>

        {/* 2. Top Spacer for Navbar */}
        <div className="h-20 sm:h-24" />

        {/* 3. Center Cinematic Brand Typography & Hero Headlines */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY, scale: contentScale }}
          className="relative z-10 container-shell w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center text-center my-auto pt-4 pb-8 will-change-transform"
        >
          {/* Subtle Horizontal Flare Beam */}
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[2px] w-[500px] sm:w-[840px] opacity-80 blur-[1px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(52, 211, 153, 0.4) 25%, rgba(255, 255, 255, 0.95) 50%, rgba(14, 165, 233, 0.4) 75%, transparent 100%)',
            }}
          />

          {/* Massive Cinematic Brand Typography */}
          <TextShift
            direction="up"
            distance={24}
            duration={0.8}
            as="h1"
            className="select-none font-sans text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black uppercase leading-none text-white tracking-[0.3em] pl-[0.3em] drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)]"
          >
            BIZINTEL
          </TextShift>

          {/* Subtitle Tagline */}
          <FadeLift delay={0.15} distance={14} duration={0.6}>
            <p className="mt-4 sm:mt-5 text-xs sm:text-sm font-mono uppercase tracking-[0.55em] pl-[0.55em] text-cyan-200/90 font-semibold drop-shadow-md">
              AI-Powered Enterprise Intelligence
            </p>
          </FadeLift>

          {/* Main Value Proposition Description */}
          <FadeLift delay={0.25} distance={16} duration={0.6}>
            <p className="mt-6 sm:mt-7 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed text-zinc-300/95 font-medium drop-shadow-md mx-auto">
              Enterprise intelligence layer combining quantitative strategy backtesting, DataMart SQL analytics, and retail AI decision support.
            </p>
          </FadeLift>

          {/* Interactive Magnetic CTA Buttons */}
          <FadeLift delay={0.35} distance={20} duration={0.6} className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton strength={0.25}>
              <Link to="/signup">
                <Button
                  variant="default"
                  size="lg"
                  className="h-11 px-7 text-xs sm:text-sm bg-white text-zinc-950 font-bold hover:bg-zinc-200 rounded-full transition-all shadow-[0_0_35px_rgba(255,255,255,0.25)] flex items-center gap-2 group cursor-pointer"
                >
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
            </MagneticButton>

            <MagneticButton strength={0.2}>
              <button
                type="button"
                onClick={handleScrollDown}
                className="h-11 px-6 text-xs sm:text-sm font-medium border border-white/20 bg-black/40 text-white hover:bg-white/15 hover:border-white/40 rounded-full transition-all backdrop-blur-xl shadow-lg cursor-pointer"
              >
                Explore Capabilities
              </button>
            </MagneticButton>
          </FadeLift>

          {/* 3-Point Proof Highlights */}
          <div className="mt-10 sm:mt-12 pt-5 border-t border-white/15 w-full max-w-2xl">
            <StaggerGroup
              staggerDelay={0.1}
              initialDelay={0.4}
              className="flex flex-wrap items-center justify-around gap-4 sm:gap-8 text-xs font-mono text-zinc-300 font-medium"
            >
              <StaggerItem>
                <div className="flex items-center gap-2 drop-shadow-sm">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>Deterministic Backtests</span>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="flex items-center gap-2 drop-shadow-sm">
                  <Database className="size-4 text-cyan-400" />
                  <span>Real-Time DataMart SQL</span>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="flex items-center gap-2 drop-shadow-sm">
                  <Sparkles className="size-4 text-[#d2f831]" />
                  <span>Retail AI Assistant</span>
                </div>
              </StaggerItem>
            </StaggerGroup>
          </div>
        </motion.div>

        {/* 4. Bottom Scroll Indicator */}
        <motion.div
          style={{ opacity: indicatorOpacity }}
          className="relative z-10 flex flex-col items-center justify-center pb-6 pt-2"
        >
          <button
            type="button"
            onClick={handleScrollDown}
            className="group flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Scroll to platform capabilities"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-80 group-hover:opacity-100">
              Scroll to explore
            </span>
            <ChevronDown className="size-4 animate-bounce opacity-75 group-hover:opacity-100" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default Hero;
