import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CinematicLoaderProps {
  onComplete?: () => void;
  brandName?: string;
  minDuration?: number; // ms
}

export function CinematicLoader({
  onComplete,
  brandName = 'B I Z I N T E L',
  minDuration = 1200,
}: CinematicLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [stripsFinished, setStripsFinished] = useState(false);

  useEffect(() => {
    // Check if user already saw the loader in this session
    const hasLoaded = sessionStorage.getItem('bizintel_loader_shown');
    if (hasLoaded) {
      setIsFinished(true);
      setStripsFinished(true);
      onComplete?.();
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(Math.floor((elapsed / minDuration) * 100), 100);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFinished(true);
          sessionStorage.setItem('bizintel_loader_shown', 'true');
          setTimeout(() => {
            setStripsFinished(true);
            onComplete?.();
          }, 800);
        }, 200);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [minDuration, onComplete]);

  if (stripsFinished) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex flex-col justify-between">
      {/* 5 Shutter Slice Strips for dramatic wipe reveal */}
      <div className="absolute inset-0 flex flex-row z-10">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="flex-1 h-full bg-[#0c0d11] border-r border-white/[0.04] last:border-r-0"
            initial={{ y: 0 }}
            animate={isFinished ? { y: i % 2 === 0 ? '-105%' : '105%' } : { y: 0 }}
            transition={{
              duration: 0.85,
              delay: i * 0.08,
              ease: [0.76, 0, 0.24, 1],
            }}
          />
        ))}
      </div>

      {/* Minimal Brand Loader UI */}
      <AnimatePresence>
        {!isFinished && (
          <motion.div
            key="loader-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-white"
          >
            <div className="flex flex-col items-center max-w-sm w-full">
              {/* Brand Wordmark with subtle glow */}
              <motion.div
                initial={{ opacity: 0, y: 10, letterSpacing: '0.6em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0.8em' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="text-xs sm:text-sm font-mono font-bold tracking-[0.8em] text-white/90 pl-[0.8em] uppercase select-none mb-8"
              >
                {brandName}
              </motion.div>

              {/* Minimalist Progress Track */}
              <div className="w-48 sm:w-64">
                <div className="h-[2px] w-full bg-white/[0.12] rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 via-[#d2f831] to-emerald-400 rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2.5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span>initializing engine</span>
                  </span>
                  <span className="text-zinc-400">{progress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CinematicLoader;
