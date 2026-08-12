import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MenuIcon } from '../../../components/ui/icons';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

/**
 * Authenticated application shell: collapsible sidebar (mobile drawer) +
 * top bar with user profile menu. All protected pages render inside it.
 */
export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b-2 border-white bg-black px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="border-2 border-white bg-black p-2 text-white transition-all hover:bg-ink-card lg:hidden rounded-md"
              aria-label="Open sidebar"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <p className="text-sm font-bold uppercase tracking-wider text-white">
              {pageTitleFromPath(location.pathname)}
            </p>
          </div>

          <UserMenu />
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8 bg-black">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/datasets': 'Datasets',
  '/datamart': 'DataMart',
  '/datamart/query': 'Query builder',
  '/datamart/analyses': 'Analyses',
  '/datamart/metrics': 'Metrics',
  '/datamart/dashboards': 'Dashboards',
  '/datamart/compare': 'Compare datasets',
  '/backtesting': 'Backtesting',
  '/ai-assistant': 'AI Assistant',
  '/settings': 'Settings',
};

function pageTitleFromPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/datasets/')) return 'Datasets';
  if (pathname.startsWith('/datamart/analyses/')) return 'Analysis';
  if (pathname.startsWith('/datamart/dashboards/')) return 'Dashboard';
  return 'Workspace';
}
