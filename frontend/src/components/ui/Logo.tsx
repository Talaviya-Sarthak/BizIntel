import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5 select-none', className)}>
      {/* Modern Monochrome Geometric Logo Mark */}
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/80 shadow-inner group">
        <svg
          viewBox="0 0 32 32"
          className="h-4.5 w-4.5 text-zinc-100 transition-transform duration-300 group-hover:scale-110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Abstract Data Nodes & Prism Layers */}
          <path
            d="M16 4L26 10V22L16 28L6 22V10L16 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="opacity-40"
          />
          <path
            d="M16 10L22 13.5V20.5L16 24L10 20.5V13.5L16 10Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="17" r="2.5" fill="#ffffff" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
      </span>

      {/* Brand Label */}
      <span className="flex items-center gap-2">
        <span className="text-sm font-semibold tracking-tight text-white font-sans">
          BizIntel
        </span>
      </span>
    </span>
  );
}
