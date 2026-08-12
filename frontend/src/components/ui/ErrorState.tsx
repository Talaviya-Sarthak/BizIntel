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
        'flex flex-col items-center justify-center border-2 border-pink bg-pink/5 px-6 py-12 text-center rounded-md',
        className,
      )}
    >
      {Icon ? (
        <span className="inline-flex h-14 w-14 items-center justify-center border-2 border-pink bg-pink/10 text-pink">
          <Icon className="h-7 w-7" />
        </span>
      ) : null}
      <h3 className="mt-5 text-lg font-bold uppercase tracking-wider text-white">{title}</h3>
      {message ? <p className="mt-2 max-w-md text-sm text-pink/80">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 border-2 border-white bg-black px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-brutal-xs transition-all duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
