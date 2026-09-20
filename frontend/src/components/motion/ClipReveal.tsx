import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { useGsapEffect } from '../../lib/motion/useGsapEffect';
import { gsap } from '../../lib/motion/gsap-init';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface ClipRevealProps {
  children: React.ReactNode;
  direction?: 'left-to-right' | 'right-to-left' | 'bottom-to-top' | 'top-to-bottom' | 'center';
  duration?: number;
  delay?: number;
  className?: string;
  scrollTrigger?: boolean;
}

/**
 * Technique 6: Clip Reveal
 * Reveals images, containers, and illustrations using clean geometric clip-path animations.
 */
export function ClipReveal({
  children,
  direction = 'left-to-right',
  duration = 0.9,
  delay = 0.1,
  className,
  scrollTrigger = true,
}: ClipRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const getInitialClip = () => {
    switch (direction) {
      case 'left-to-right':
        return 'inset(0% 100% 0% 0%)';
      case 'right-to-left':
        return 'inset(0% 0% 0% 100%)';
      case 'bottom-to-top':
        return 'inset(100% 0% 0% 0%)';
      case 'top-to-bottom':
        return 'inset(0% 0% 100% 0%)';
      case 'center':
        return 'inset(50% 50% 50% 50%)';
    }
  };

  useGsapEffect(() => {
    if (reducedMotion || !containerRef.current) return;

    const el = containerRef.current;
    gsap.set(el, { clipPath: getInitialClip(), opacity: 0 });

    const animConfig: gsap.TweenVars = {
      clipPath: 'inset(0% 0% 0% 0%)',
      opacity: 1,
      duration,
      delay,
      ease: 'power3.inOut',
    };

    if (scrollTrigger) {
      animConfig.scrollTrigger = {
        trigger: el,
        start: 'top 85%',
        once: true,
      };
    }

    gsap.to(el, animConfig);
  }, containerRef, [direction, duration, delay, scrollTrigger]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={clsx('overflow-hidden will-change-[clip-path,opacity]', className)}>
      {children}
    </div>
  );
}

export default ClipReveal;
