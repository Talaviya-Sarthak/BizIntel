import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { DocumentIcon, GithubIcon } from './icons';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Backtesting', href: '#backtesting' },
      { label: 'DataMart Analytics', href: '#datamart' },
      { label: 'AI Assistant', href: '#ai' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Overview', href: '#platform' },
      { label: 'Capabilities', href: '#features' },
      { label: 'Architecture', href: '#architecture' },
      { label: 'Security', href: '#security' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Database Guide', href: '#' },
      { label: 'Architecture Notes', href: '#' },
    ],
  },
  {
    title: 'Company',
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
    <footer id="resources" className="border-t border-white/10 py-16">
      <div className="container-shell">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              A unified intelligence platform for analytics, backtesting, and
              AI-powered business insights.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="#"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyan-400/30 hover:text-white"
                aria-label="Documentation"
              >
                <DocumentIcon className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyan-400/30 hover:text-white"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link: FooterLink) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-slate-500 transition hover:text-cyan-300"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-slate-500 transition hover:text-cyan-300"
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} PS-05 Enterprise Intelligence Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <a href="#security" className="transition hover:text-slate-400">Security</a>
            <a href="#top" className="transition hover:text-slate-400">Back to top</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
