import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';
import { DashboardPreview } from './DashboardPreview';

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-10%] top-32 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
      </div>

      <div className="container-shell relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up">
            <span className="section-label">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Unified Analytics &amp; AI Platform
            </span>
          </div>

          <h1
            className="mt-6 animate-fade-in-up text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl"
            style={{ animationDelay: '80ms' }}
          >
            Turn Enterprise Data
            <span className="block bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Into Decisions
            </span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-base leading-relaxed text-slate-400 sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            A unified intelligence platform for analytics, backtesting, data
            exploration, and AI-powered business insights — built for teams
            that operate on evidence.
          </p>

          <div
            className="mt-9 flex animate-fade-in-up flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: '240ms' }}
          >
            <Link to="/signup">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#platform">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Platform
              </Button>
            </a>
          </div>
        </div>

        <div
          id="platform"
          className="mt-16 animate-fade-in-up sm:mt-20"
          style={{ animationDelay: '320ms' }}
        >
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
