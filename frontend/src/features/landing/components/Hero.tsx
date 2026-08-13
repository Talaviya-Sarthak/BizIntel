import { Hero as HeroComponent } from '@/components/ui/hero-1';

export function Hero() {
  return (
    <HeroComponent
      title="Build smarter tools for modern teams"
      subtitle="Streamline your workflow and boost productivity with intuitive solutions. Security, speed, and simplicity—all in one platform."
      eyebrow="Next-Gen Productivity"
      ctaLabel="Get Started"
      ctaHref="/signup"
    />
  );
}
