import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

export interface FadeLiftProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  viewportOnce?: boolean;
  viewportMargin?: string;
}

/**
 * Technique 4: Fade + Lift
 * Starts with slight vertical/horizontal displacement and opacity 0,
 * then smoothly animates into natural position when entering viewport.
 */
export function FadeLift({
  children,
  delay = 0,
  duration = 0.55,
  distance = 24,
  direction = 'up',
  className,
  viewportOnce = true,
  viewportMargin = '-40px',
  ...props
}: FadeLiftProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const getInitialOffset = () => {
    switch (direction) {
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      case 'none':
      default:
        return { x: 0, y: 0 };
    }
  };

  const offset = getInitialOffset();

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: viewportOnce, margin: viewportMargin }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98], // Enterprise smooth cubic-bezier
      }}
      className={clsx('will-change-transform', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default FadeLift;
