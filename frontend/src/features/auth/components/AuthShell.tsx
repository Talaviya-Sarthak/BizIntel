import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { CheckIcon } from '../../landing/components/icons';

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
    <div className="flex min-h-screen bg-surface-deep">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-16">
          <Link to="/">
            <Logo />
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
              One platform for enterprise intelligence.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 xl:text-base">
              Analyze data, backtest strategies, and get AI-powered insights —
              secured behind enterprise-grade authentication.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/25">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} BizIntel-Enterprise Intelligence Platform
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-6 py-16 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex lg:hidden">
            <Logo />
          </Link>

          <div className="rounded-2xl border border-white/10 bg-surface-elevated/60 p-6 backdrop-blur sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
        </div>
      </div>
    </div>
  );
}
