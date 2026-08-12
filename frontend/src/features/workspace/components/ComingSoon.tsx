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
    <div className="flex flex-col gap-6 bg-black">
      <div>
        <span className="inline-flex items-center gap-2 border border-yellow bg-yellow/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow rounded-sm">
          <ClockIcon className="h-4 w-4" />
          Coming soon
        </span>
      </div>
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <span className="inline-flex items-center gap-2 border border-white bg-black px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-muted rounded-sm">
            {moduleName ?? 'Module'} · planned for a later phase
          </span>
        }
      />
    </div>
  );
}
