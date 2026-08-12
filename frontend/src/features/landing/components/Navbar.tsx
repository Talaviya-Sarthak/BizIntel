import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b-2 transition-all duration-200 ${
        scrolled || open ? 'border-white bg-black' : 'border-transparent bg-transparent'
      }`}
    >
      <nav className="container-shell flex h-16 items-center justify-between" aria-label="Main">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Desktop Navbar Links */}
        <div className="hidden items-center gap-2 lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <div key={item.id} className="relative">
                {item.isRoute ? (
                  <Link
                    to={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 rounded-md border-2 border-transparent ${
                      isActive
                        ? 'text-lime bg-white/10 border-white/20'
                        : 'text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-150 rounded-md border-2 border-transparent ${
                      isActive
                        ? 'text-lime bg-white/10 border-white/20'
                        : 'text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="default" size="sm">
                Open Console
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/signin" className="hidden min-[400px]:inline-block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center border-2 border-white bg-black text-white rounded-md lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t-2 border-white bg-ink-soft lg:hidden">
          <div className="container-shell flex flex-col gap-2 py-4">
            {NAV_ITEMS.map((item) =>
              item.isRoute ? (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`rounded-md border-2 border-transparent px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    activeSection === item.id
                      ? 'bg-lime text-black border-white'
                      : 'text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`rounded-md border-2 border-transparent px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    activeSection === item.id
                      ? 'bg-lime text-black border-white'
                      : 'text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </a>
              )
            )}
            <div className="mt-3 flex flex-col gap-2 border-t-2 border-white pt-4">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Open Console
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signin" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setOpen(false)}>
                    <Button variant="primary" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
