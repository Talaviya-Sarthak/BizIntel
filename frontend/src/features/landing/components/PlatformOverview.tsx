import { FeaturesSectionWithHoverEffects } from '../../../components/ui/feature-section-with-hover-effects';
import { FadeLift, TextShift, ClipReveal } from '../../../components/motion';
import { DashboardPreview } from './DashboardPreview';

export function PlatformOverview() {
  return (
    <section id="capabilities" className="relative py-16 sm:py-24 border-t border-white/[0.08] bg-[#090a0f]">
      <div className="container-shell max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <FadeLift delay={0} distance={14} duration={0.5}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-zinc-900/80 px-3.5 py-1 text-[11px] font-mono uppercase tracking-wide text-zinc-300">
              Platform Capabilities
            </span>
          </FadeLift>

          <TextShift direction="up" distance={18} duration={0.65} delay={0.1} as="h2" className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-4xl font-display uppercase">
            Unified Analytics &amp; Intelligence Capabilities
          </TextShift>

          <FadeLift delay={0.2} distance={16} duration={0.55}>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-zinc-400">
              Engineered for quantitative research, business analytics, and generative decision-making in a single governed pipeline.
            </p>
          </FadeLift>
        </div>

        {/* Interactive Platform Workspace Showcase Mockup */}
        <FadeLift delay={0.25} distance={28} duration={0.7} className="mb-14">
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/[0.12] bg-[#0c0d12]/90 p-2 sm:p-3 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_60px_rgba(52,211,153,0.08)] backdrop-blur-2xl transition-transform duration-500 hover:scale-[1.008]">
            <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
            <ClipReveal direction="bottom-to-top" duration={0.85} delay={0.1}>
              <DashboardPreview />
            </ClipReveal>
          </div>
        </FadeLift>

        {/* 8 Staggered Capability Grid Cards */}
        <ClipReveal direction="bottom-to-top" duration={0.8} delay={0.15}>
          <div className="rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-zinc-900/40 backdrop-blur-sm overflow-hidden shadow-2xl">
            <FeaturesSectionWithHoverEffects />
          </div>
        </ClipReveal>
      </div>
    </section>
  );
}

export default PlatformOverview;
