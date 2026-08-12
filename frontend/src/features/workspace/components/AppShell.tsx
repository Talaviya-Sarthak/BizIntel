import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MenuIcon } from '../../../components/ui/icons';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isFullBleedPage = location.pathname === '/ai-assistant';

  return (
    <div className="flex min-h-screen bg-surface-deep text-slate-100 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64 h-screen">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-surface-deep/80 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/5 lg:hidden"
              aria-label="Open sidebar"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold text-white">
              {pageTitleFromPath(location.pathname)}
            </p>
          </div>

          <UserMenu />
        </header>

        <main className={`flex-1 flex flex-col min-h-0 ${isFullBleedPage ? 'p-0 overflow-hidden' : 'px-5 py-8 sm:px-8 overflow-y-auto'}`}>
          {isFullBleedPage ? (
            <Outlet />
          ) : (
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          )}
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
  '/knowledge-base': 'Knowledge Base',
  '/upload-center': 'Upload Center',
  '/reports': 'Reports & Artifacts',
  '/settings': 'Settings & Health',
};

function pageTitleFromPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/datasets/')) return 'Datasets';
  if (pathname.startsWith('/datamart/analyses/')) return 'Analysis';
  if (pathname.startsWith('/datamart/dashboards/')) return 'Dashboard';
  return 'Workspace';
}
