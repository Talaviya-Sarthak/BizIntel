import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { CheckCircleIcon } from '../../../components/ui/icons';

const HIGHLIGHTS = [
  'Unified analytics, backtesting & AI intelligence',
  'JWT-authenticated, secure-by-design workspace',
  'Serverless PostgreSQL data layer',
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Shared two-panel layout for the sign-in / sign-up screens.
 * The brand panel is hidden on small screens.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full max-w-5xl border-2 border-white bg-black rounded-md overflow-hidden shadow-brutal my-8">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block bg-ink-soft border-r-2 border-white neo-grid-bg">
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link to="/">
            <Logo />
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl uppercase">
              One platform for enterprise intelligence.
            </h2>
            <p className="mt-4 text-xs leading-relaxed text-muted uppercase font-bold tracking-wider">
              Analyze data, backtest strategies, and get AI-powered insights —
              secured behind enterprise-grade authentication.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-white">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center border border-lime text-lime bg-lime/10">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
            © {new Date().getFullYear()} BizIntel Platform
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:w-1/2 bg-black">
        <div className="w-full">
          <Link to="/" className="mb-8 inline-flex lg:hidden">
            <Logo />
          </Link>

          <div className="border-2 border-white bg-ink-card p-6 sm:p-8 rounded-md shadow-brutal-sm">
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">{title}</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          <div className="mt-6 text-center text-xs font-bold uppercase tracking-wider text-muted">{footer}</div>
        </div>
      </div>
    </div>
  );
}
