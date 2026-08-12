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
        'flex flex-col items-center justify-center border-2 border-dashed border-white bg-ink-card px-6 py-14 text-center rounded-md',
        className,
      )}
    >
      {Icon ? (
        <span className="inline-flex h-14 w-14 items-center justify-center border-2 border-lime bg-lime/10 text-lime">
          <Icon className="h-7 w-7" />
        </span>
      ) : null}
      <h3 className="mt-5 text-lg font-bold uppercase tracking-wider text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
