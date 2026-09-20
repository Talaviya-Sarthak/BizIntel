import { useLayoutEffect, useEffect, type RefObject } from 'react';
import { gsap } from './gsap-init';
import { useReducedMotion } from './useReducedMotion';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Custom hook to run GSAP animations scoped to a container element.
 * Automatically cleans up animations, timelines, and ScrollTriggers on unmount.
 */
export function useGsapEffect(
  effect: (context: gsap.Context) => void,
  scope?: RefObject<HTMLElement | null>,
  deps: React.DependencyList = []
) {
  const reducedMotion = useReducedMotion();

  useIsomorphicLayoutEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context((self) => {
      effect(self);
    }, scope?.current || undefined);

    return () => ctx.revert();
  }, [reducedMotion, ...deps]);
}
