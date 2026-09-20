import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface AnimatedStateProps {
  children: React.ReactNode;
  stateKey: string | number;
  mode?: 'sync' | 'wait' | 'popLayout';
  transitionType?: 'fade' | 'slide-up' | 'scale' | 'fade-slide';
  className?: string;
  duration?: number;
}

/**
 * Technique 11: State Change Animation
 * Smoothly morphs UI state transitions (loading -> ready, tab 1 -> tab 2, stage A -> stage B).
 */
export function AnimatedState({
  children,
  stateKey,
  mode = 'wait',
  transitionType = 'fade-slide',
  className,
  duration = 0.28,
}: AnimatedStateProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getVariants = () => {
    switch (transitionType) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -12 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.96 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.96 },
        };
      case 'fade-slide':
      default:
        return {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -8 },
        };
    }
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={stateKey}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{
          duration,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        className={clsx('w-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default AnimatedState;
