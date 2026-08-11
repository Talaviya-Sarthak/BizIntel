import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';

export function CTA() {
  return (
    <section id="cta" className="relative py-20 sm:py-28">
      <div className="container-shell">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-b from-cyan-400/[0.08] to-transparent px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-24 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Build smarter decisions with Enterprise Intelligence.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
              Start with a secure workspace and add analytics, backtesting, and
              AI intelligence as your data grows.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
