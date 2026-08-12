import EnterpriseAIPipeline from '../../../components/ui/ai-agent-pipeline';

export function Architecture() {
  return (
    <section id="architecture" className="relative py-16 sm:py-24 border-t-2 border-white bg-black">
      <div className="container-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col items-start">
            <span className="section-label">
              Enterprise Architecture
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl uppercase">
              A layered pipeline built for scale
            </h2>
            <p className="mt-3 text-sm font-bold uppercase tracking-wider text-muted leading-relaxed">
              From raw enterprise data to business decisions, each layer is a clean, replaceable module. The platform composes them into one governed intelligence pipeline.
            </p>

            <div className="mt-6 space-y-3">
              {['Decoupled, modular services', 'Versioned REST API', 'Schema-managed database', 'Extensible by design'].map(
                (point) => (
                  <div key={point} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-white">
                    <span className="inline-flex h-5 w-5 items-center justify-center border border-lime bg-lime/10 text-[10px] font-black text-lime">
                      ✓
                    </span>
                    {point}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="w-full flex justify-center">
            <EnterpriseAIPipeline />
          </div>
        </div>
      </div>
    </section>
  );
}
