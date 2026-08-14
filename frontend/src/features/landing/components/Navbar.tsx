import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Logo } from '../../../components/ui/Logo';
import { useAuth } from '../../../hooks/useAuth';
import { CloseIcon, MenuIcon } from './icons';

interface NavItem {
  id: string;
  label: string;
  href: string;
  isRoute?: boolean;
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

  // Scroll detection for background elevation
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Section observer for scroll tracking
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
      const offsetPosition = elementPosition - 75;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(item.id);
    }
  };

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: scrolled || open ? 'rgba(9, 9, 11, 0.85)' : 'rgba(9, 9, 11, 0.4)',
        borderColor: scrolled || open ? 'rgba(39, 39, 42, 0.7)' : 'rgba(39, 39, 42, 0.2)',
      }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl"
    >
      <nav className="container-shell grid grid-cols-2 lg:grid-cols-3 h-16 py-0 items-center w-full" aria-label="Main">
        {/* Left: Brand Logo */}
        <div className="flex items-center justify-start">
          <Link to="/" className="flex items-center transition-opacity hover:opacity-90">
            <Logo />
          </Link>
        </div>

        {/* Center: Mathematically Centered Minimal Glass Navigation Bar */}
        <div className="hidden lg:flex items-center justify-center w-full">
          <div
            className="flex items-center gap-1 rounded-full border border-zinc-800/80 bg-zinc-900/60 p-1 backdrop-blur-md shadow-inner shadow-black/40 relative"
            onMouseLeave={() => setHoveredSection(null)}
          >
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
                      className="absolute inset-0 rounded-full bg-zinc-800/80 -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Active Indicator Background Pill */}
                  {isActive && !isHovered && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-zinc-800/40 border border-zinc-700/50 -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {item.isRoute ? (
                    <Link
                      to={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      className={`px-3.5 py-1.5 text-xs font-medium tracking-tight transition-colors duration-150 block rounded-full ${
                        isActive ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      className={`px-3.5 py-1.5 text-xs font-medium tracking-tight transition-colors duration-150 block rounded-full ${
                        isActive ? 'text-white font-semibold' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {item.label}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: CTA Actions */}
        <div className="flex items-center justify-end gap-3">
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="h-9 text-xs px-4 border-zinc-800 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 rounded-xl transition-all shadow-sm">
                  Open Console
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" size="sm" className="h-9 text-xs px-3.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm" className="h-9 text-xs px-4 bg-white text-zinc-950 font-medium hover:bg-zinc-200 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.12)]">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-xl lg:hidden"
          >
            <div className="container-shell flex flex-col gap-1.5 py-4">
              {NAV_ITEMS.map((item) =>
                item.isRoute ? (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-zinc-800/90 text-white font-semibold border border-zinc-700/50'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-zinc-800/90 text-white font-semibold border border-zinc-700/50'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </a>
                )
              )}
              <div className="mt-3 flex flex-col gap-2 border-t border-zinc-800/80 pt-3">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <Button variant="secondary" className="w-full h-9 text-xs rounded-xl">
                      Open Console
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/signin" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full h-9 text-xs text-zinc-300 rounded-xl">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setOpen(false)}>
                      <Button variant="default" className="w-full h-9 text-xs bg-white text-zinc-950 font-medium rounded-xl">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

