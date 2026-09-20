import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface TextShiftProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  duration?: number;
  delay?: number;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

/**
 * Technique 9: Text Shift
 * Adds a subtle directional text shift entrance to headings and badges without layout instability.
 */
export function TextShift({
  children,
  direction = 'up',
  distance = 16,
  duration = 0.6,
  delay = 0,
  className,
  as: Component = 'div',
}: TextShiftProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    const Tag = Component;
    return <Tag className={className}>{children}</Tag>;
  }

  const getOffset = () => {
    switch (direction) {
      case 'left':
        return { x: distance, y: 0 };
      case 'right':
        return { x: -distance, y: 0 };
      case 'up':
        return { y: distance, x: 0 };
      case 'down':
        return { y: -distance, x: 0 };
    }
  };

  const offset = getOffset();
  const MotionComponent = motion[Component as keyof typeof motion] as any;

  return (
    <MotionComponent
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // Expressive smooth cubic
      }}
      className={clsx('will-change-transform inline-block', className)}
    >
      {children}
    </MotionComponent>
  );
}

export default TextShift;
