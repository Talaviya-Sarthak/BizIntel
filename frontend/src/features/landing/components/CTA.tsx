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

export function CTA() {
  return (
    <section id="cta" className="relative py-12 sm:py-16 border-t border-zinc-800/80 overflow-hidden">
      {/* Ambient Radial Glow Lighting with Parallax */}
      <ParallaxLayer speed={0.25} className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[350px] bg-gradient-to-b from-emerald-500/[0.04] via-zinc-400/[0.02] to-transparent blur-[130px] rounded-full" />
      </ParallaxLayer>

      <div className="container-shell relative z-10">
        <FadeLift
          delay={0.1}
          distance={24}
          duration={0.65}
          className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/80 px-6 py-10 sm:px-12 sm:py-14 text-center shadow-2xl backdrop-blur-xl max-w-[950px] mx-auto"
        >
          {/* Top Subtle Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md shadow-inner shadow-black/40 mb-6">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Ready for Enterprise Deployment</span>
          </div>

          <div className="relative max-w-[720px] mx-auto flex flex-col items-center">
            {/* Enterprise Metallic Headline with TextShift */}
            <TextShift
              direction="up"
              distance={20}
              duration={0.7}
              as="h2"
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] select-none text-center"
            >
              <span className="bg-[linear-gradient(180deg,#FFFFFF_0%,#E4E4E7_50%,#A1A1AA_100%)] bg-clip-text text-transparent block">
                Transform Data Into
              </span>
              <span className="bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F4F5_45%,#71717A_100%)] bg-clip-text text-transparent block mt-1">
                Competitive Intelligence
              </span>
            </TextShift>

            {/* Muted 2-line Description */}
            <FadeLift delay={0.15} distance={16} duration={0.55}>
              <p className="mt-5 sm:mt-6 text-sm sm:text-base leading-relaxed text-zinc-400 font-normal max-w-[580px] text-center">
                Start with a secure workspace and unify strategy backtesting, DataMart SQL analytics, and retail AI intelligence as your business grows.
              </p>
            </FadeLift>

            {/* Action Buttons with Magnetic CTA */}
            <div className="mt-9 sm:mt-11 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <MagneticButton strength={0.25} className="w-full sm:w-auto">
                <Link to="/signup" className="w-full sm:w-auto inline-block">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full sm:w-auto h-11 px-7 text-xs sm:text-sm bg-white text-zinc-950 font-semibold hover:bg-zinc-200 rounded-xl transition-all duration-200 shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 group"
                  >
                    Get Started
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </MagneticButton>

              <MagneticButton strength={0.2} className="w-full sm:w-auto">
                <Link to="/signin" className="w-full sm:w-auto inline-block">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-11 px-7 text-xs sm:text-sm border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 font-medium rounded-xl transition-all duration-200 shadow-sm backdrop-blur-md"
                  >
                    Sign In
                  </Button>
                </Link>
              </MagneticButton>
            </div>

            {/* Trust Indicators Section with StaggerGroup */}
            <div className="mt-14 pt-8 border-t border-zinc-800/60 w-full max-w-[620px]">
              <StaggerGroup staggerDelay={0.08} initialDelay={0.2} className="flex flex-wrap items-center justify-around gap-4 sm:gap-6 text-xs font-medium text-zinc-400">
                <StaggerItem>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">✓</span>
                    <span>Enterprise Ready</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">✓</span>
                    <span>Secure by Design</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">✓</span>
                    <span>AI Powered</span>
                  </div>
                </StaggerItem>
                <StaggerItem>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-semibold">✓</span>
                    <span>Built for Scale</span>
                  </div>
                </StaggerItem>
              </StaggerGroup>
            </div>
          </div>
        </FadeLift>
      </div>
    </section>
  );
}

export default CTA;
