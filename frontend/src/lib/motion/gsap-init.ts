import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger safely in browser context
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Configure smooth default ScrollTrigger behavior
  ScrollTrigger.config({
    limitCallbacks: true,
    ignoreMobileResize: true,
  });
}

export { gsap, ScrollTrigger };

/**
 * Standard enterprise easing curves
 */
export const MOTION_EASE = {
  smooth: 'power2.out',
  expressive: 'power3.out',
  gentle: 'sine.out',
  spring: 'back.out(1.4)',
  magnetic: 'power4.out',
  expo: 'expo.out',
} as const;
