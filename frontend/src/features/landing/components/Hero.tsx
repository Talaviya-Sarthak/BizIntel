import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';
import {
  ParallaxLayer,
  TextShift,
  FadeLift,
  MagneticButton,
  StaggerGroup,
  StaggerItem,
} from '../../../components/motion';

export function Hero() {
  return (
    <section
      id="platform"
      className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 overflow-hidden"
    >
      {/* Background ambient lighting glow with subtle Parallax */}
      <ParallaxLayer speed={0.3} className="absolute inset-0 flex items-center justify-center">
        <div className="w-[700px] h-[400px] bg-gradient-to-b from-zinc-400/10 via-zinc-600/5 to-transparent blur-[140px] pointer-events-none rounded-full" />
      </ParallaxLayer>
      <ParallaxLayer speed={-0.2} className="absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[250px] bg-emerald-500/[0.03] blur-[110px] pointer-events-none rounded-full" />
      </ParallaxLayer>

      <div className="container-shell relative z-10 w-full flex justify-center">
        {/* Constrained 960px Max-Width Hero Container */}
        <div className="flex flex-col items-center text-center max-w-[960px] w-full mx-auto my-auto pt-6 sm:pt-8">
          
          {/* Headline with TextShift & Metallic Gradient */}
          <TextShift direction="up" distance={20} duration={0.7} as="h1" className="text-[38px] sm:text-[54px] lg:text-[70px] font-extrabold tracking-tight leading-[1.1] sm:leading-[1.08] select-none text-center">
            <span className="bg-[linear-gradient(180deg,#FFFFFF_0%,#E4E4E7_50%,#A1A1AA_100%)] bg-clip-text text-transparent inline sm:block">
              Enterprise Intelligence for{' '}
            </span>
            <span className="bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F4F5_45%,#71717A_100%)] bg-clip-text text-transparent inline sm:block sm:mt-1">
              Smarter Business Decisions
            </span>
          </TextShift>

          {/* Subheading with FadeLift */}
          <FadeLift delay={0.15} distance={20} duration={0.6}>
            <p className="mt-8 sm:mt-10 max-w-[620px] text-sm sm:text-base leading-relaxed text-zinc-400 font-normal tracking-normal text-center">
              A unified enterprise intelligence layer combining quantitative strategy backtesting, DataMart SQL analytics, and retail AI decision support.
            </p>
          </FadeLift>

          {/* CTAs with MagneticButton */}
          <FadeLift delay={0.25} distance={20} duration={0.6} className="mt-9 sm:mt-11 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton strength={0.25}>
              <Link to="/signup">
                <Button
                  variant="default"
                  size="lg"
                  className="h-11 px-6 text-xs sm:text-sm bg-white text-zinc-950 font-semibold hover:bg-zinc-200 rounded-xl transition-all shadow-[0_0_30px_rgba(255,255,255,0.12)] flex items-center gap-2 group"
                >
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
            </MagneticButton>

            <MagneticButton strength={0.2}>
              <a href="#capabilities">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 px-6 text-xs sm:text-sm border-zinc-800/90 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 font-medium rounded-xl transition-all shadow-sm backdrop-blur-md"
                >
                  Explore Capabilities
                </Button>
              </a>
            </MagneticButton>
          </FadeLift>

          {/* Minimal Enterprise Proof Highlights with StaggerGroup */}
          <div className="mt-10 sm:mt-12 pt-5 border-t border-zinc-800/60 w-full max-w-[760px]">
            <StaggerGroup staggerDelay={0.1} initialDelay={0.35} className="flex flex-wrap items-center justify-around gap-4 sm:gap-8 text-xs font-medium text-zinc-400">
              <StaggerItem>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span>Deterministic Strategy Backtests</span>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span>Real-Time DataMart SQL</span>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span>Autonomous AI Decision Support</span>
                </div>
              </StaggerItem>
            </StaggerGroup>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
