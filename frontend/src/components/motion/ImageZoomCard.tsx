import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface ImageZoomCardProps {
  children: React.ReactNode;
  className?: string;
  imageClassName?: string;
  zoomScale?: number; // default 1.04
  as?: React.ElementType;
  onClick?: () => void;
}

/**
 * Technique 8: Image Zoom
 * Provides container-bounded smooth scale on hover with hardware acceleration.
 */
export function ImageZoomCard({
  children,
  className,
  imageClassName,
  zoomScale = 1.04,
  onClick,
}: ImageZoomCardProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className={clsx('overflow-hidden rounded-2xl', className)} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={clsx('group relative overflow-hidden rounded-2xl', className)}
      whileHover="hover"
      onClick={onClick}
    >
      <motion.div
        variants={{
          hover: {
            scale: zoomScale,
            transition: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] },
          },
        }}
        className={clsx('w-full h-full will-change-transform', imageClassName)}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default ImageZoomCard;
