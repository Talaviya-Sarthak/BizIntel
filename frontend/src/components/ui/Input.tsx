import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, endAdornment, id, ...props }, ref) => {
    return (
      <div className="w-full grid gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center justify-center text-zinc-500 pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            id={id}
            type={type}
            className={clsx(
              'flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
              icon && 'pl-9',
              endAdornment && 'pr-9',
              error && 'border-red-500/50 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-2.5 flex items-center justify-center z-10">
              {endAdornment}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
