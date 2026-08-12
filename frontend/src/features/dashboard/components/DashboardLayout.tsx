import { useState, type ComponentType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError } from '../../../lib/api';
import {
  DatabaseZapIcon,
  SparklesIcon,
  TrendingUpIcon,
  CloseIcon,
  MenuIcon,
} from '../../landing/components/icons';

interface NavItem {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: TrendingUpIcon, path: '/dashboard' },
  { label: 'Backtesting', icon: TrendingUpIcon, path: '/backtesting' },
  { label: 'DataMart', icon: DatabaseZapIcon, path: '/datasets' },
  { label: 'AI Assistant', icon: SparklesIcon, path: '' },
];

interface DashboardLayoutProps {
  children: ReactNode;
  activeNav?: string;
}

export function DashboardLayout({ children, activeNav = 'Backtesting' }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      navigate('/signin', { replace: true });
    } catch (error) {
      const apiError = toApiError(error);
      setSignOutError(apiError.message);
    } finally {
      setSigningOut(false);
    }
  }

  const initials = (user?.name ?? 'U')
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-surface-deep">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-surface-elevated/60 backdrop-blur transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Logo />
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4" aria-label="Workspace">
          {NAV_ITEMS.map((item) => {
            const isActive = item.label === activeNav;
            return item.path ? (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-white/5 ${
                  isActive
                    ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20'
                    : 'text-slate-400'
                }`}
              >
                {item.icon ? <item.icon className="h-4 w-4" /> : null}
                {item.label}
              </button>
            ) : (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400"
              >
                <span className="flex items-center gap-3">
                  {item.icon ? <item.icon className="h-4 w-4" /> : null}
                  {item.label}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                  Soon
                </span>
              </div>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4">
          <p className="text-xs text-slate-500">Enterprise Intelligence · v0.1</p>
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-surface-deep/80 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-white">Workspace</h1>
          </div>

          <div className="flex items-center gap-4">
            {signOutError ? (
              <span className="hidden text-xs text-red-400 sm:inline">{signOutError}</span>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
                {initials}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} loading={signingOut}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 px-5 py-10 sm:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
