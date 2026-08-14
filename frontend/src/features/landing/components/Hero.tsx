import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';

export function Hero() {
  return (
    <section id="platform" className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Background ambient lighting glow - aligned on exact center axis */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-b from-zinc-400/10 via-zinc-600/5 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-white/[0.02] blur-[110px] pointer-events-none rounded-full" />

      <div className="container-shell relative z-10 w-full flex justify-center">
        {/* Constrained 960px Max-Width Hero Container */}
        <div className="flex flex-col items-center text-center max-w-[960px] w-full mx-auto my-auto pt-6 sm:pt-8">
          
          {/* Static Centered Refined Headline with Premium Metallic Gradient */}
          <h1 className="text-[38px] sm:text-[54px] lg:text-[70px] font-extrabold tracking-tight leading-[1.1] sm:leading-[1.08] select-none text-center">
            <span className="bg-[linear-gradient(180deg,#FFFFFF_0%,#E4E4E7_50%,#A1A1AA_100%)] bg-clip-text text-transparent inline sm:block">
              Enterprise Intelligence for{' '}
            </span>
            <span className="bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F4F5_45%,#71717A_100%)] bg-clip-text text-transparent inline sm:block sm:mt-1">
              Smarter Business Decisions
            </span>
          </h1>

          {/* Concise Subheading with Comfortable Whitespace & Line-Height */}
          <p className="mt-8 sm:mt-10 max-w-[620px] text-sm sm:text-base leading-relaxed text-zinc-400 font-normal tracking-normal text-center">
            A unified enterprise intelligence layer combining quantitative strategy backtesting, DataMart SQL analytics, and retail AI decision support.
          </p>

          {/* Redesigned CTAs */}
          <div className="mt-9 sm:mt-11 flex flex-wrap items-center justify-center gap-4">
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
            <a href="#capabilities">
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-6 text-xs sm:text-sm border-zinc-800/90 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 font-medium rounded-xl transition-all shadow-sm backdrop-blur-md"
              >
                Explore Capabilities
              </Button>
            </a>
          </div>

          {/* Minimal Enterprise Proof Highlights */}
          <div className="mt-10 sm:mt-12 pt-5 border-t border-zinc-800/60 w-full max-w-[760px] flex flex-wrap items-center justify-around gap-4 sm:gap-8 text-xs font-medium text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <span>Deterministic Strategy Backtests</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <span>Real-Time DataMart SQL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
              <span>Autonomous AI Decision Support</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}





