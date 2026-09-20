import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface StaggerGroupProps {
  children: React.ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
  viewportOnce?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: { staggerDelay: number; initialDelay: number }) => ({
    opacity: 1,
    transition: {
      delayChildren: custom.initialDelay,
      staggerChildren: custom.staggerDelay,
    },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

/**
 * Technique 5: Stagger Animation
 * Animates child elements sequentially with a controlled, rhythmic delay.
 */
export function StaggerGroup({
  children,
  staggerDelay = 0.08,
  initialDelay = 0.05,
  className,
  viewportOnce = true,
}: StaggerGroupProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: viewportOnce, margin: '-40px' }}
      custom={{ staggerDelay, initialDelay }}
      className={clsx('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={itemVariants} className={clsx('will-change-transform', className)}>
      {children}
    </motion.div>
  );
}

export default StaggerGroup;
