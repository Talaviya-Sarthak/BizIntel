import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';

export function CTA() {
  return (
    <section id="cta" className="relative py-16 sm:py-24 border-t-2 border-white bg-black">
      <div className="container-shell">
        <div className="relative overflow-hidden border-2 border-white bg-ink-card px-6 py-12 text-center sm:px-12 sm:py-16 shadow-brutal rounded-md">
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl uppercase">
              Build smarter decisions with Enterprise Intelligence.
            </h2>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted sm:text-sm">
              Start with a secure workspace and add analytics, backtesting, and AI intelligence as your data grows.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="default" size="lg" className="w-full shadow-brutal-sm hover:translate-y-[2px]">
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
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
