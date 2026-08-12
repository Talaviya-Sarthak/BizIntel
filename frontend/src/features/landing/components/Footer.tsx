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
    <footer id="resources" className="border-t-2 border-white pt-14 pb-10 bg-ink-soft">
      <div className="container-shell">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-xs font-bold uppercase tracking-wider text-muted leading-relaxed">
                Unified analytics, strategy backtesting, and AI intelligence for enterprise decisions.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 border-2 border-lime bg-lime/10 px-3.5 py-1 text-[10px] font-bold text-lime uppercase tracking-widest w-fit rounded-sm">
                <span className="h-2 w-2 rounded-full bg-lime animate-pulse" />
                All Systems Operational
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center border-2 border-white bg-black text-white hover:bg-lime hover:text-black transition-all rounded-md shadow-brutal-xs hover:translate-y-[1px]"
                  aria-label="GitHub"
                >
                  <GithubIcon className="h-4 w-4" />
                </a>
                <a
                  href="#resources"
                  className="inline-flex h-9 w-9 items-center justify-center border-2 border-white bg-black text-white hover:bg-lime hover:text-black transition-all rounded-md shadow-brutal-xs hover:translate-y-[1px]"
                  aria-label="Documentation"
                >
                  <DocumentIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-black text-white uppercase tracking-widest">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link: FooterLink) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-lime"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-lime"
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

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t-2 border-white pt-8 sm:flex-row">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
            © {new Date().getFullYear()} BizIntel Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-widest text-muted">
            <a href="#resources" className="transition-colors hover:text-white">Privacy Policy</a>
            <a href="#resources" className="transition-colors hover:text-white">Terms of Service</a>
            <a href="#top" className="transition-colors hover:text-white">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
