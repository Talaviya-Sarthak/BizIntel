import { FeaturesSectionWithHoverEffects } from '../../../components/ui/feature-section-with-hover-effects';

export function PlatformOverview() {
  return (
    <section id="capabilities" className="relative py-16 sm:py-24 border-t-2 border-white bg-black">
      <div className="container-shell">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="section-label">
            Platform Capabilities
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl uppercase">
            Unified Analytics &amp; Intelligence Capabilities
          </h2>
          <p className="mt-2 text-sm font-bold uppercase tracking-wider text-muted">
            Engineered for quantitative research, business analytics, and generative decision-making in a single governed pipeline.
          </p>
        </div>

        <div className="rounded-md border-2 border-white bg-ink-card overflow-hidden shadow-brutal">
          <FeaturesSectionWithHoverEffects />
        </div>
      </div>
    </section>
  );
}
