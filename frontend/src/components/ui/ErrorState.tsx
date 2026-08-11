import type { ComponentType } from 'react';
import { clsx } from 'clsx';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  icon: Icon,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.04] px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10 text-red-400 ring-1 ring-red-400/20">
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
      {message ? <p className="mt-1.5 max-w-md text-sm text-red-300/80">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
