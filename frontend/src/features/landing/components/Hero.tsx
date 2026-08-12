import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';
import { IntelligenceConsole } from './IntelligenceConsole';

export function Hero() {
  return (
    <section id="platform" className="relative pb-16 pt-28 sm:pb-24 sm:pt-36 overflow-hidden">
      {/* Subtle Dot Grid Background in Hero Area */}
      <div className="absolute inset-0 neo-dot-bg pointer-events-none opacity-40 z-0" />

      <div className="container-shell relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Column: Redesign Typographic composition */}
          <div className="flex flex-col items-start text-left animate-fade-in-up">
            <div>
              <span className="inline-flex items-center gap-2 border-2 border-white bg-black px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-lime">
                <span className="h-2.5 w-2.5 bg-lime shrink-0" />
                BizIntel Core Intelligence
              </span>
            </div>

            {/* Massive headline: TURN DATA INTO DECISIONS */}
            <h1 className="mt-6 text-5xl font-black tracking-tighter uppercase sm:text-6xl xl:text-7xl leading-[0.95]">
              Turn Data <br />
              Into <span className="text-lime bg-lime/10 px-2 border-2 border-lime">Decisions.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 max-w-lg text-sm font-bold uppercase tracking-wider text-muted leading-relaxed">
              A unified enterprise intelligence layer combining quantitative strategy backtesting, DataMart SQL analytics, and retail AI decision support.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/signup">
                <Button variant="default" size="lg" className="shadow-brutal hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-brutal-press">
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <a href="#capabilities">
                <Button variant="outline" size="lg">
                  Explore Capabilities
                </Button>
              </a>
            </div>

            {/* Brutalist Statistics Row */}
            <div className="mt-12 grid grid-cols-3 gap-4 w-full border-t-2 border-white pt-8 bg-black">
              <div>
                <p className="text-2xl font-black uppercase text-lime">100M+</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Rows Analyzed</p>
              </div>
              <div>
                <p className="text-2xl font-black uppercase text-pink">500+</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Strategies Run</p>
              </div>
              <div>
                <p className="text-2xl font-black uppercase text-yellow">99.9%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Uptime SLAs</p>
              </div>
            </div>
          </div>

          {/* Right Column: Console Preview */}
          <div className="w-full flex justify-center lg:justify-end animate-fade-in">
            <IntelligenceConsole />
          </div>
        </div>
      </div>
    </section>
  );
}
