import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus-visible:ring-cyan-400/50 shadow-[0_0_0_1px_rgba(8,145,178,0.4),0_8px_24px_-8px_rgba(34,211,238,0.5)]',
  secondary:
    'bg-white/10 text-white hover:bg-white/15 focus-visible:ring-white/30 border border-white/10',
  outline:
    'border border-white/15 text-slate-200 hover:border-cyan-400/50 hover:text-white focus-visible:ring-cyan-400/40',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5 focus-visible:ring-white/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}

function Spinner({ size }: { size: 'sm' | 'md' }) {
  return (
    <svg
      className={clsx(
        'animate-spin',
        size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
      )}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
      />
    </svg>
  );
}

export { Spinner };
