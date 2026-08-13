import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { GithubIcon, LinkedinIcon, MailIcon } from './icons';

interface FooterLink {
  label: string;
  href?: string;
  to?: string;
  isExternal?: boolean;
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Analytics', to: '/datamart' },
  { label: 'Knowledge Center', to: '/knowledge-base' },
  { label: 'DataMart', to: '/datamart' },
  { label: 'Forecasting', to: '/backtesting' },
  { label: 'AI Assistant', to: '/ai-assistant' },
  { label: 'Backtesting', to: '/backtesting' },
];

const RESOURCE_LINKS: FooterLink[] = [
  { label: 'Documentation', href: '#documentation' },
  { label: 'API Reference', href: '#api' },
  { label: 'Release Notes', href: '#releases' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Support', to: '/contact' },
  { label: 'Status', href: '#status' },
];

const COMPANY_LINKS: FooterLink[] = [
  { label: 'About', href: '#about' },
  { label: 'Privacy', href: '#privacy' },
  { label: 'Terms', href: '#terms' },
  { label: 'Contact', to: '/contact' },
  { label: 'GitHub', href: 'https://github.com', isExternal: true },
];

export function Footer() {
  return (
    <footer id="resources" className="w-full bg-[#0A0A0A] text-zinc-400 border-t border-white/[0.08] pt-20 pb-12 font-sans select-none">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
        {/* 4-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Left Column: Brand & Description */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <h3 className="mt-3.5 text-sm font-semibold text-white tracking-tight">
                Enterprise Intelligence Platform
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-zinc-400 max-w-sm">
                AI-powered enterprise analytics, business intelligence, forecasting, and knowledge management built for modern organizations.
              </p>
            </div>

            <div className="mt-8 text-xs text-zinc-500 leading-relaxed">
              <p>© 2026 Enterprise Intelligence Platform</p>
              <p className="text-zinc-500 mt-0.5">Built with AI.</p>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-[0.04em] uppercase mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="text-sm text-zinc-400 opacity-70 hover:opacity-100 hover:text-white transition-all duration-200 hover:-translate-y-[1px] inline-block"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-zinc-400 opacity-70 hover:opacity-100 hover:text-white transition-all duration-200 hover:-translate-y-[1px] inline-block"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-[0.04em] uppercase mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="text-sm text-zinc-400 opacity-70 hover:opacity-100 hover:text-white transition-all duration-200 hover:-translate-y-[1px] inline-block"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-zinc-400 opacity-70 hover:opacity-100 hover:text-white transition-all duration-200 hover:-translate-y-[1px] inline-block"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-[0.04em] uppercase mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="text-sm text-zinc-400 opacity-70 hover:opacity-100 hover:text-white transition-all duration-200 hover:-translate-y-[1px] inline-block"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      target={link.isExternal ? '_blank' : undefined}
                      rel={link.isExternal ? 'noreferrer' : undefined}
                      className="text-sm text-zinc-400 opacity-70 hover:opacity-100 hover:text-white transition-all duration-200 hover:-translate-y-[1px] inline-block"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Thin Divider */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          {/* Left: Version */}
          <div className="font-mono text-zinc-500">
            Version 1.0.0
          </div>

          {/* Center: Tagline */}
          <div className="text-zinc-400 font-normal">
            Made for modern enterprises.
          </div>

          {/* Right: Small Monochrome Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="text-zinc-400 opacity-60 hover:opacity-100 hover:text-white transition-opacity duration-200"
            >
              <GithubIcon className="w-[18px] h-[18px]" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="text-zinc-400 opacity-60 hover:opacity-100 hover:text-white transition-opacity duration-200"
            >
              <LinkedinIcon className="w-[18px] h-[18px]" />
            </a>
            <a
              href="mailto:contact@bizintel.com"
              aria-label="Email"
              className="text-zinc-400 opacity-60 hover:opacity-100 hover:text-white transition-opacity duration-200"
            >
              <MailIcon className="w-[18px] h-[18px]" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
