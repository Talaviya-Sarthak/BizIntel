import { useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError } from '../../../lib/api';
import {
  BarChartIcon,
  DatabaseZapIcon,
  SparklesIcon,
  TrendingUpIcon,
  CloseIcon,
  MenuIcon,
} from '../../landing/components/icons';

interface NavItem {
  label: string;
  active?: boolean;
  icon?: ComponentType<{ className?: string }>;
  soon?: boolean;
  path?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', active: true },
  { label: 'Backtesting', icon: TrendingUpIcon, path: '/backtesting' },
  { label: 'DataMart', icon: DatabaseZapIcon, soon: true },
  { label: 'AI Assistant', icon: SparklesIcon, soon: true },
];

const MODULES = [
  {
    icon: TrendingUpIcon,
    name: 'Backtesting',
    description: 'Historical strategy execution and performance analysis.',
    path: '/backtesting',
  },
  {
    icon: DatabaseZapIcon,
    name: 'DataMart Analytics',
    description: 'Dataset ingestion, validation, and SQL analytics.',
    path: '',
  },
  {
    icon: SparklesIcon,
    name: 'AI Assistant',
    description: 'Natural-language questions answered from enterprise data.',
    path: '',
  },
] as const;

export function DashboardPage() {
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
          {NAV_ITEMS.map((item) =>
            item.path ? (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path!)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-left transition-colors hover:bg-white/5 ${
                  item.active
                    ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20'
                    : 'text-slate-400'
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon ? <item.icon className="h-4 w-4" /> : null}
                  {item.label}
                </span>
              </button>
            ) : (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                  item.active
                    ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20'
                    : 'text-slate-400'
                }`}
              >
                <span className="flex items-center gap-3">
                  {item.icon ? <item.icon className="h-4 w-4" /> : null}
                  {item.label}
                </span>
                {item.soon ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                    Soon
                  </span>
                ) : null}
              </div>
            )
          )}
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
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col gap-2">
              <span className="section-label">Workspace</span>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
                Your Enterprise Intelligence workspace is being initialized.
                Core modules will light up here as the platform rolls out.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {MODULES.map((module) => (
                <button
                  key={module.name}
                  type="button"
                  disabled={!module.path}
                  onClick={() => module.path && navigate(module.path)}
                  className={`rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition-colors ${
                    module.path ? 'hover:border-white/20 hover:bg-white/[0.05] cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
                    <module.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">{module.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {module.description}
                  </p>
                  {module.path ? (
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cyan-400">
                      <BarChartIcon className="h-3 w-3" />
                      Open
                    </span>
                  ) : (
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-500">
                      <BarChartIcon className="h-3 w-3" />
                      Coming soon
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-6">
              <p className="text-sm font-medium text-cyan-200">Initialization status</p>
              <div className="mt-3 flex flex-col gap-2">
                {['Authentication', 'API foundation', 'Database & migrations', 'Landing experience'].map(
                  (item, index) => (
                    <div key={item} className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-400/25">
                        ✓
                      </span>
                      {item}
                      {index === 0 ? <span className="text-slate-500">— ready</span> : null}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
