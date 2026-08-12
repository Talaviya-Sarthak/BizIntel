import type { ComponentType, ReactNode } from 'react';

interface BuilderSectionProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Standard panel used by every section of the query builder so the builder
 * reads as a coherent set of cards.
 */
export function BuilderSection({ title, description, icon: Icon, actions, children }: BuilderSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}