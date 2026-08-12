import React from 'react';
import { clsx } from 'clsx';

export function Spinner({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  return (
    <span
      className={clsx(
        'inline-block animate-spin rounded-full border-lime border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link' | 'default';
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';

    const variants: Record<string, string> = {
      default: 'bg-lime text-black border-2 border-white shadow-brutal-sm hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-brutal-press active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
      primary: 'bg-lime text-black border-2 border-white shadow-brutal-sm hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-brutal-press active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
      secondary: 'bg-ink-card text-white border-2 border-white shadow-brutal-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
      outline: 'bg-black text-white border-2 border-white hover:bg-ink-card hover:translate-x-[2px] hover:translate-y-[2px]',
      ghost: 'bg-transparent text-muted hover:text-white hover:bg-ink-card border-2 border-transparent',
      danger: 'bg-pink text-black border-2 border-white shadow-brutal-sm hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-brutal-press',
      link: 'text-lime underline-offset-4 hover:underline border-0 uppercase tracking-wider',
    };

    const sizes: Record<string, string> = {
      default: 'h-10 px-5 py-2',
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(baseStyles, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
        {...props}
      >
        {loading ? <Spinner className="h-4 w-4" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
