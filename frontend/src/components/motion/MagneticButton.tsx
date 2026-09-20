import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { clsx } from 'clsx';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // 0.1 to 0.5 (default 0.28)
  activeScale?: number;
  as?: React.ElementType;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: any;
}

/**
 * Technique 7: Magnetic CTA
 * Moves subtly toward the user's cursor on hover with physics-based spring restoration.
 * Automatically disabled on touch screens and under prefers-reduced-motion.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.28,
  activeScale = 0.97,
  as: Component = 'div',
  onClick,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [isPointerDevice, setIsPointerDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPointerDevice(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    }
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth responsive spring physics
  const springX = useSpring(x, { stiffness: 260, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 260, damping: 20, mass: 0.5 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !isPointerDevice || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = (e.clientX - centerX) * strength;
    const distanceY = (e.clientY - centerY) * strength;

    x.set(distanceX);
    y.set(distanceY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (reducedMotion || !isPointerDevice) {
    return (
      <div className={clsx('inline-block', className)} onClick={onClick} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: activeScale }}
      className={clsx('inline-block will-change-transform', className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default MagneticButton;
