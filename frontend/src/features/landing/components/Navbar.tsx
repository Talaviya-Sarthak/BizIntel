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
        backgroundColor: scrolled || open ? 'rgba(9, 9, 11, 0.88)' : 'rgba(9, 9, 11, 0)',
        borderColor: scrolled || open ? 'rgba(39, 39, 42, 0.8)' : 'rgba(39, 39, 42, 0)',
      }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md"
    >
      <nav className="container-shell flex h-14 items-center justify-between" aria-label="Main">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Compact Sleek Vercel-Style Desktop Navbar Links */}
        <div
          className="hidden items-center gap-1.5 lg:flex relative py-1"
          onMouseLeave={() => setHoveredSection(null)}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            const isHovered = hoveredSection === item.id;

            return (
              <div
                key={item.id}
                className="relative py-1"
                onMouseEnter={() => setHoveredSection(item.id)}
              >
                {/* Hover Pill Background */}
                {isHovered && (
                  <motion.div
                    layoutId="hover-pill"
                    className="absolute inset-0 rounded-md bg-zinc-800/60 -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                {item.isRoute ? (
                  <Link
                    to={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-2.5 py-1 text-xs font-medium tracking-tight transition-colors duration-150 block ${
                      isActive ? 'text-zinc-50 font-semibold' : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-2.5 py-1 text-xs font-medium tracking-tight transition-colors duration-150 block ${
                      isActive ? 'text-zinc-50 font-semibold' : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {item.label}
                  </a>
                )}

                {/* Active White Bottom Underline */}
                {isActive && (
                  <motion.div
                    layoutId="active-underline"
                    className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Right CTA Actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="h-8 text-xs px-3 border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
                Open Console
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/signin">
                <Button variant="ghost" size="sm" className="h-8 text-xs px-3 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" size="sm" className="h-8 text-xs px-3.5 bg-zinc-50 text-zinc-950 font-medium hover:bg-zinc-200">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-900 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md lg:hidden"
          >
            <div className="container-shell flex flex-col gap-1 py-4">
              {NAV_ITEMS.map((item) =>
                item.isRoute ? (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-zinc-800 text-zinc-50 font-semibold'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      activeSection === item.id
                        ? 'bg-zinc-800 text-zinc-50 font-semibold'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50'
                    }`}
                  >
                    {item.label}
                  </a>
                )
              )}
              <div className="mt-3 flex flex-col gap-2 border-t border-zinc-800/80 pt-3">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <Button variant="secondary" className="w-full h-8 text-xs">
                      Open Console
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/signin" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full h-8 text-xs text-zinc-300">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setOpen(false)}>
                      <Button variant="default" className="w-full h-8 text-xs bg-zinc-50 text-zinc-950">
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
