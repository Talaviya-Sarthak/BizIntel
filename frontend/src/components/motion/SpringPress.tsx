import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface SpringPressProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  pressScale?: number; // default 0.96
  hoverScale?: number; // default 1.0
  className?: string;
  disabled?: boolean;
}

/**
 * Technique 10: Press + Spring
 * Provides tactile, spring-based physical feedback when interactive controls are clicked or tapped.
 */
export function SpringPress({
  children,
  pressScale = 0.96,
  hoverScale = 1.0,
  className,
  disabled = false,
  ...props
}: SpringPressProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileTap={{ scale: pressScale }}
      whileHover={hoverScale !== 1.0 ? { scale: hoverScale } : undefined}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.6,
      }}
      className={clsx('inline-block will-change-transform cursor-pointer', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default SpringPress;
