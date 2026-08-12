import type { ComponentType } from 'react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ClockIcon } from '../../../components/ui/icons';

interface ComingSoonProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  /** Module name used in the badge (e.g. "Backtesting module"). */
  moduleName?: string;
}

/**
 * Honest placeholder for modules that ship in later phases. Never presents
 * fake functionality as implemented.
 */
export function ComingSoon({ icon, title, description, moduleName }: ComingSoonProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/90">
          <ClockIcon className="h-3.5 w-3.5" />
          Coming soon
        </span>
      </div>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5 text-xs uppercase tracking-wider text-slate-500">
            {moduleName ?? 'Module'} · planned for a later phase
          </span>
        }
      />
    </div>
  );
}
