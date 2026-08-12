import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <span className="relative inline-flex h-8 w-8 items-center justify-center border-2 border-lime bg-lime/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-lime" fill="none" aria-hidden="true">
          <path
            d="M4 15l4-4 3 3 5-6 4 4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d="M4 19h16"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="square"
          />
        </svg>
      </span>
      <span className="text-base font-bold tracking-tight text-white uppercase">
        BizIntel
      </span>
    </span>
  );
}
