import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { DocumentIcon, GithubIcon } from './icons';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Backtesting Engine', href: '#capabilities' },
      { label: 'DataMart Analytics', href: '#capabilities' },
      { label: 'Retail AI Assistant', href: '#capabilities' },
      { label: 'Workspace Console', to: '/dashboard' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Overview', href: '#platform' },
      { label: 'Capabilities', href: '#capabilities' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Architecture', href: '#architecture' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#resources' },
      { label: 'API Reference', href: '#resources' },
      { label: 'System Status', href: '#resources' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', to: '/signin' },
      { label: 'Create Account', to: '/signup' },
      { label: 'Console', to: '/dashboard' },
    ],
  },
] as const;

interface FooterLink {
  label: string;
  href?: string;
  to?: string;
}

export function Footer() {
  return (
    <footer id="resources" className="border-t border-zinc-800/80 pt-14 pb-10 bg-zinc-950/60 backdrop-blur-sm">
      <div className="container-shell">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col justify-between">
            <div>
              <Logo />
              <p className="mt-3.5 max-w-xs text-xs leading-relaxed text-zinc-400">
                Unified analytics, strategy backtesting, and AI intelligence for enterprise decisions.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] font-medium text-zinc-400 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800"
                  aria-label="GitHub"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href="#resources"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 hover:bg-zinc-800"
                  aria-label="Documentation"
                >
                  <DocumentIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link: FooterLink) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-xs text-zinc-400 transition hover:text-zinc-100"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-xs text-zinc-400 transition hover:text-zinc-100"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-800/80 pt-6 sm:flex-row">
          <p className="text-[11px] text-zinc-500">
            © {new Date().getFullYear()} PS-05 Enterprise Intelligence Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-[11px] text-zinc-500">
            <a href="#resources" className="transition hover:text-zinc-300">Privacy Policy</a>
            <a href="#resources" className="transition hover:text-zinc-300">Terms of Service</a>
            <a href="#top" className="transition hover:text-zinc-300">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
