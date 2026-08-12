import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-400/40">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-400" fill="none" aria-hidden="true">
          <path
            d="M4 15l4-4 3 3 5-6 4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 19h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
      </span>
      <span className="text-base font-bold tracking-tight text-white">
        BizIntel
        <span className="ml-2 hidden text-xs font-medium uppercase tracking-[0.22em] text-slate-500 sm:inline">
          Intelligence
        </span>
      </span>
    </span>
  );
}
