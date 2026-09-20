import EnterpriseAIPipeline from '../../../components/ui/ai-agent-pipeline';
import {
  TextShift,
  FadeLift,
  ClipReveal,
  StaggerGroup,
  StaggerItem,
  ImageZoomCard,
} from '../../../components/motion';

const ARCH_POINTS = [
  'Decoupled, modular analytics & backtesting engines',
  'Versioned REST API with predictable response envelopes',
  'PostgreSQL schema-managed datamarts & DuckDB vector storage',
  'Extensible enterprise RAG and multi-tool agent routing',
];

export function Architecture() {
  return (
    <section id="architecture" className="relative py-12 sm:py-16 border-t border-zinc-800/80 overflow-hidden">
      <div className="container-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          
          {/* Left Column: Description & Bullet Stagger */}
          <div>
            <FadeLift delay={0} distance={16} duration={0.5}>
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-[11px] font-medium tracking-wide text-zinc-300">
                Enterprise Architecture
              </span>
            </FadeLift>

            <TextShift
              direction="up"
              distance={18}
              duration={0.65}
              delay={0.1}
              as="h2"
              className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-4xl font-display uppercase"
            >
              A layered pipeline built for scale
            </TextShift>

            <FadeLift delay={0.15} distance={16} duration={0.55}>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                From raw enterprise data to business decisions, each layer is a clean,
                replaceable module. The platform composes them into one governed intelligence pipeline.
              </p>
            </FadeLift>

            <StaggerGroup staggerDelay={0.08} initialDelay={0.25} className="mt-6 space-y-2.5">
              {ARCH_POINTS.map((point) => (
                <StaggerItem key={point}>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-[9px] font-bold text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                      ✓
                    </span>
                    <span>{point}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>

          {/* Right Column: ClipReveal & Zoom Card on AI Pipeline Visual */}
          <div className="w-full flex justify-center">
            <ClipReveal direction="right-to-left" duration={0.85} delay={0.15} className="w-full">
              <ImageZoomCard zoomScale={1.02} className="w-full border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md p-4 sm:p-6 shadow-2xl">
                <EnterpriseAIPipeline />
              </ImageZoomCard>
            </ClipReveal>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Architecture;
