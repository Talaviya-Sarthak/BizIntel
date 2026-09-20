import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { useGsapEffect } from '../../lib/motion/useGsapEffect';
import { gsap } from '../../lib/motion/gsap-init';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface ScrubProgressProps {
  className?: string;
  barClassName?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Technique 2: Scrub Animation
 * Provides smooth, scroll-linked progress indicator bars and timeline scrubbers.
 */
export function ScrubProgress({
  className,
  barClassName = 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400',
  triggerRef,
  orientation = 'horizontal',
}: ScrubProgressProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGsapEffect(() => {
    if (reducedMotion || !barRef.current) return;

    const bar = barRef.current;
    const trigger = triggerRef?.current || document.body;

    if (orientation === 'horizontal') {
      gsap.fromTo(
        bar,
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start: triggerRef ? 'top 80%' : 'top top',
            end: triggerRef ? 'bottom 20%' : 'bottom bottom',
            scrub: 0.3,
          },
        }
      );
    } else {
      gsap.fromTo(
        bar,
        { scaleY: 0, transformOrigin: 'top center' },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start: triggerRef ? 'top 80%' : 'top top',
            end: triggerRef ? 'bottom 20%' : 'bottom bottom',
            scrub: 0.3,
          },
        }
      );
    }
  }, containerRef, [triggerRef, orientation]);

  if (reducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className={clsx(
        orientation === 'horizontal' ? 'w-full h-0.5' : 'h-full w-0.5',
        'bg-zinc-800/40 overflow-hidden relative',
        className
      )}
    >
      <div
        ref={barRef}
        className={clsx('w-full h-full will-change-transform', barClassName)}
      />
    </div>
  );
}

export default ScrubProgress;
