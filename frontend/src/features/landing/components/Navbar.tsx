import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { ScrubProgress, MagneticButton } from '../../../components/motion';
import { useAuth } from '../../../hooks/useAuth';
import { CloseIcon, MenuIcon } from './icons';

interface NavItem {
  id: string;
  label: string;
  href: string;
  isRoute?: boolean;
  statusBadge?: string;
  statusDot?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'platform', label: 'Platform', href: '#platform' },
  { id: 'capabilities', label: 'Capabilities', href: '#capabilities' },
  { id: 'architecture', label: 'Architecture', href: '#architecture' },
  { id: 'faq', label: 'FAQ', href: '#faq' },
  { id: 'contact', label: 'Contact', href: '/contact', isRoute: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('platform');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Section observer
  useEffect(() => {
    if (location.pathname !== '/') {
      if (location.pathname === '/contact') {
        setActiveSection('contact');
      }
      return;
    }

    const sectionIds = ['platform', 'capabilities', 'architecture', 'faq'];
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -65% 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  // Smooth scroll handler
  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.isRoute) {
      setOpen(false);
      setActiveSection(item.id);
      return;
    }

    e.preventDefault();
    setOpen(false);

    if (location.pathname !== '/') {
      navigate(`/${item.href}`);
      return;
    }

    const targetEl = document.getElementById(item.id);
    if (targetEl) {
      const elementPosition = targetEl.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 85;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(item.id);
    }
  };

  return (
    <header className="fixed top-2 sm:top-3.5 z-50 mx-auto inset-x-0 w-[calc(100%-1.25rem)] sm:w-[calc(100%-2rem)] max-w-6xl">
      <motion.div
        initial={false}
        animate={{
          backgroundColor: scrolled || open ? 'rgba(12, 13, 17, 0.94)' : 'rgba(12, 13, 17, 0.85)',
          borderColor: scrolled || open ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.10)',
        }}
        className="rounded-2xl sm:rounded-full border shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl px-3.5 sm:px-5 lg:px-6 h-12 sm:h-13 flex items-center justify-between transition-all"
      >
        {/* Left: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
            <Logo />
          </Link>
        </div>

        {/* Center: Centered Glass Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] p-1 shadow-inner backdrop-blur-md relative" onMouseLeave={() => setHoveredSection(null)}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const isHovered = hoveredSection === item.id;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredSection(item.id)}
              >
                {/* Hover Pill Background */}
                {isHovered && (
                  <motion.div
                    layoutId="hover-pill"
                    className="absolute inset-0 rounded-full bg-white/[0.1] -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Active Indicator Background Pill */}
                {isActive && !isHovered && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full bg-white/[0.14] border border-white/[0.12] -z-10 shadow-xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {item.isRoute ? (
                  <Link
                    to={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-3 py-1.5 text-xs font-medium tracking-tight transition-all block rounded-full ${
                      isActive ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-3 py-1.5 text-xs font-medium tracking-tight transition-all block rounded-full ${
                      isActive ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </a>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right: CTA Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="h-8.5 text-xs px-3.5 border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.12] rounded-full transition-all shadow-xs font-semibold">
                  Open Console
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="sm" className="h-8.5 text-xs px-3 text-zinc-300 hover:text-white hover:bg-white/[0.08] rounded-full transition-all">
                    Sign In
                  </Button>
                </Link>
                <MagneticButton strength={0.2}>
                  <Link to="/signup">
                    <Button variant="default" size="sm" className="h-8.5 text-xs px-4 bg-[#d2f831] text-zinc-950 font-bold hover:bg-[#c3e826] rounded-full transition-all shadow-[0_0_20px_rgba(210,248,49,0.25)]">
                      Get Started
                    </Button>
                  </Link>
                </MagneticButton>
              </>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button
            type="button"
            className="grid size-8.5 place-items-center rounded-full border border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.14] active:scale-95 transition-all lg:hidden shadow-xs cursor-pointer"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Drawer Dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mt-2 overflow-hidden rounded-3xl border border-white/[0.14] bg-[#0c0d11]/95 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl lg:hidden"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                </span>
                <span className="text-[11px] font-mono font-medium text-zinc-300 tracking-wider uppercase">
                  BizIntel Engine Active
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">v2.4</span>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 gap-1.5 p-3">
              {NAV_ITEMS.map((item) =>
                item.isRoute ? (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-xs font-semibold transition-all ${
                      activeSection === item.id
                        ? 'bg-white/[0.16] text-white border border-white/[0.14] shadow-sm font-bold'
                        : 'bg-white/[0.03] text-zinc-300 border border-transparent hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-xs font-semibold transition-all ${
                      activeSection === item.id
                        ? 'bg-white/[0.16] text-white border border-white/[0.14] shadow-sm font-bold'
                        : 'bg-white/[0.03] text-zinc-300 border border-transparent hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </a>
                )
              )}
            </div>

            {/* Drawer Actions */}
            <div className="border-t border-white/[0.08] p-3 bg-white/[0.02]">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d2f831] py-2.5 text-xs font-bold text-neutral-950 transition-all">
                  Open Console
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/signup" onClick={() => setOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d2f831] py-2.5 text-xs font-bold text-neutral-950 transition-all shadow-[0_0_20px_rgba(210,248,49,0.25)]">
                    Get Started
                  </Link>
                  <Link to="/signin" onClick={() => setOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.06] py-2.5 text-xs font-bold text-white transition-all hover:bg-white/[0.12]">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrubProgress className="absolute -bottom-1 left-4 right-4 rounded-full" />
    </header>
  );
}

export default Navbar;
