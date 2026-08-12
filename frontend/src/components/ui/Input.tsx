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
          <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-white">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 flex items-center justify-center text-muted pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            id={id}
            type={type}
            className={clsx(
              'flex h-10 w-full border-2 border-white bg-black px-3 py-2 text-sm text-white placeholder:text-muted outline-none transition-all rounded-md',
              'focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-9',
              endAdornment && 'pr-9',
              error && 'border-pink focus:border-pink focus:shadow-[4px_4px_0px_#FF4D8D]',
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
        {error && <p className="text-xs font-bold text-pink uppercase tracking-wider">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
