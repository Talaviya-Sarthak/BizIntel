import { FeaturesSectionWithHoverEffects } from '../../../components/ui/feature-section-with-hover-effects';
import { FadeLift, TextShift, ClipReveal } from '../../../components/motion';

export function PlatformOverview() {
  return (
    <section id="capabilities" className="relative py-12 sm:py-16 border-t border-zinc-800/80">
      <div className="container-shell">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <FadeLift delay={0} distance={16} duration={0.5}>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
              Platform Capabilities
            </span>
          </FadeLift>

          <TextShift direction="up" distance={18} duration={0.65} delay={0.1} as="h2" className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-4xl font-display uppercase">
            Unified Analytics &amp; Intelligence Capabilities
          </TextShift>

          <FadeLift delay={0.2} distance={16} duration={0.55}>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Engineered for quantitative research, business analytics, and generative decision-making in a single governed pipeline.
            </p>
          </FadeLift>
        </div>

        <ClipReveal direction="bottom-to-top" duration={0.8} delay={0.15}>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm overflow-hidden shadow-2xl">
            <FeaturesSectionWithHoverEffects />
          </div>
        </ClipReveal>
      </div>
    </section>
  );
}

export default PlatformOverview;
