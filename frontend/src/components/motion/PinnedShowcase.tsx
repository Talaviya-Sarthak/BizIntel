import React, { useRef } from 'react';
import { clsx } from 'clsx';
import { useGsapEffect } from '../../lib/motion/useGsapEffect';
import { gsap } from '../../lib/motion/gsap-init';
import { useReducedMotion } from '../../lib/motion/useReducedMotion';

interface PinnedShowcaseProps {
  children: React.ReactNode;
  pinnedContent: React.ReactNode;
  className?: string;
  pinClassName?: string;
  contentClassName?: string;
}

/**
 * Technique 3: Pin + Transform
 * Pins a visual element (e.g., enterprise pipeline architecture or data console)
 * in place while associated feature steps or content scroll alongside it.
 */
export function PinnedShowcase({
  children,
  pinnedContent,
  className,
  pinClassName,
  contentClassName,
}: PinnedShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGsapEffect(() => {
    if (reducedMotion || !containerRef.current || !pinRef.current) return;

    // Only apply pinning on desktop screens (>= 1024px) for optimal mobile layout
    if (window.innerWidth < 1024) return;

    const container = containerRef.current;
    const pinEl = pinRef.current;

    const st = gsap.to(pinEl, {
      scrollTrigger: {
        trigger: container,
        start: 'top top+=100',
        end: 'bottom bottom',
        pin: true,
        pinSpacing: false,
        scrub: true,
      },
    });

    return () => {
      st.scrollTrigger?.kill();
    };
  }, containerRef, []);

  return (
    <div ref={containerRef} className={clsx('relative w-full', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Pinned visual on the side */}
        <div ref={pinRef} className={clsx('lg:col-span-6 w-full will-change-transform', pinClassName)}>
          {pinnedContent}
        </div>

        {/* Scrolling text/steps alongside */}
        <div className={clsx('lg:col-span-6 w-full flex flex-col', contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default PinnedShowcase;
