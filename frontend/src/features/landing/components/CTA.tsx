import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { ArrowRightIcon } from './icons';

export function CTA() {
  return (
    <section id="cta" className="relative py-16 sm:py-24 border-t border-zinc-800/80">
      <div className="container-shell">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-12 text-center sm:px-12 sm:py-16 shadow-2xl backdrop-blur-sm"
        >
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              Build smarter decisions with Enterprise Intelligence.
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-zinc-400 sm:text-sm">
              Start with a secure workspace and add analytics, backtesting, and
              AI intelligence as your data grows.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup">
                <Button variant="default" size="lg" className="w-full sm:w-auto h-9.5 text-xs px-5 bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-medium rounded-lg">
                  Get Started
                  <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-9.5 text-xs px-5 border-zinc-800 bg-zinc-950 text-zinc-100 hover:bg-zinc-900 font-medium rounded-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
