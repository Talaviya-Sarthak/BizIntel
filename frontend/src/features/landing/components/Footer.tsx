import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { DocumentIcon, GithubIcon, LinkedInIcon, MailIcon, TwitterIcon } from './icons';

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
    <footer id="resources" className="relative z-10 border-t border-white/[0.08] bg-[#0A0A0A]/95 pt-16 pb-12 backdrop-blur-xl">
      <div className="container-shell">
        {/* Main Multi-Column Grid */}
        <div className="grid gap-10 sm:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
          
          {/* Left Column: Brand & Enterprise Tagline */}
          <div className="flex flex-col justify-between lg:col-span-2 pr-0 lg:pr-6">
            <div>
              <Link to="/" className="inline-block transition-opacity hover:opacity-90">
                <Logo />
              </Link>
              <p className="mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
                Unified analytics, strategy backtesting, and retail AI intelligence built for enterprise decisions.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 w-fit backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                All Systems Operational
              </div>

              {/* Social & Resource Icons */}
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 transition-all duration-200 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 hover:-translate-y-0.5 shadow-sm"
                  aria-label="GitHub"
                >
                  <GithubIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 transition-all duration-200 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 hover:-translate-y-0.5 shadow-sm"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 transition-all duration-200 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 hover:-translate-y-0.5 shadow-sm"
                  aria-label="X (Twitter)"
                >
                  <TwitterIcon className="h-4 w-4" />
                </a>
                <a
                  href="mailto:contact@bizintel.com"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 transition-all duration-200 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 hover:-translate-y-0.5 shadow-sm"
                  aria-label="Email"
                >
                  <MailIcon className="h-4 w-4" />
                </a>
                <a
                  href="#resources"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 transition-all duration-200 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 hover:-translate-y-0.5 shadow-sm"
                  aria-label="Documentation"
                >
                  <DocumentIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Center Navigation Columns */}
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col">
              <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">{column.title}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link: FooterLink) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-xs sm:text-sm text-zinc-400 transition-all duration-200 hover:text-white hover:-translate-y-0.5 inline-block"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-xs sm:text-sm text-zinc-400 transition-all duration-200 hover:text-white hover:-translate-y-0.5 inline-block"
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

        {/* Bottom Row Divider & Legal Links */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row text-xs text-zinc-500">
          <p className="tracking-tight">
            © {new Date().getFullYear()} BizIntel Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#resources" className="transition-colors duration-200 hover:text-zinc-300">Privacy Policy</a>
            <a href="#resources" className="transition-colors duration-200 hover:text-zinc-300">Terms of Service</a>
            <a href="#resources" className="transition-colors duration-200 hover:text-zinc-300">Security</a>
            <a href="#resources" className="transition-colors duration-200 hover:text-zinc-300">System Status</a>
            <a href="#top" className="transition-colors duration-200 hover:text-zinc-200 font-medium">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

