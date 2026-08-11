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
        'inline-block animate-spin rounded-full border-current border-t-transparent',
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
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700 disabled:pointer-events-none disabled:opacity-50';

    const variants: Record<string, string> = {
      default: 'bg-zinc-50 text-zinc-900 hover:bg-zinc-200',
      primary: 'bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
      outline: 'border border-zinc-800 bg-zinc-950 text-zinc-50 hover:bg-zinc-900/80',
      ghost: 'hover:bg-zinc-800 text-zinc-50',
      danger: 'bg-red-600 text-white hover:bg-red-500',
      link: 'text-zinc-50 underline-offset-4 hover:underline',
    };

    const sizes: Record<string, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-sm',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(baseStyles, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
        {...props}
      >
        {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
