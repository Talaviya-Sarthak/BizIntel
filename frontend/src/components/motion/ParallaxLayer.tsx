import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { useGsapEffect } from '../../lib/motion/useGsapEffect';
import { gsap } from '../../lib/motion/gsap-init';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number; // e.g. -0.2 (slower/reverse) to 0.5 (faster)
  direction?: 'vertical' | 'horizontal';
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Technique 1: Parallax Scroll Animation
 * Moves background layers, ambient lighting, and accents at differential scroll speeds.
 */
export function ParallaxLayer({
  children,
  speed = 0.25,
  direction = 'vertical',
  className,
  triggerRef,
}: ParallaxLayerProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGsapEffect(() => {
    if (reducedMotion || !targetRef.current) return;

    const el = targetRef.current;
    const triggerEl = triggerRef?.current || el;

    const distance = speed * 150;

    if (direction === 'vertical') {
      gsap.fromTo(
        el,
        { y: -distance / 2 },
        {
          y: distance / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: triggerEl,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        }
      );
    } else {
      gsap.fromTo(
        el,
        { x: -distance / 2 },
        {
          x: distance / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: triggerEl,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        }
      );
    }
  }, targetRef, [speed, direction, triggerRef]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={targetRef} className={clsx('will-change-transform pointer-events-none', className)}>
      {children}
    </div>
  );
}

export default ParallaxLayer;
