import type { ComponentType, ReactNode } from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-[#141414] px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <h3 className="mt-3 text-xs font-semibold text-zinc-100">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
