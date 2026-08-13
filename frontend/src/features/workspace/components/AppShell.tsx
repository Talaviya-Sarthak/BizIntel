import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Command, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('bizintel_sidebar_collapsed') === 'true';
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const isFullBleedPage = location.pathname === '/ai-assistant';

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('bizintel_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut listener for ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchItems = [
    { title: 'AI Assistant', path: '/ai-assistant', desc: 'Ask analytics, RAG, or dataset questions' },
    { title: 'Datasets', path: '/datasets', desc: 'Inspect enterprise datasets and schemas' },
    { title: 'DataMart Overview', path: '/datamart', desc: 'DataMart tables and SQL query builder' },
    { title: 'Query Builder', path: '/datamart/query', desc: 'Execute custom DataMart queries' },
    { title: 'Knowledge Base', path: '/knowledge-base', desc: 'RAG documents and corporate policies' },
    { title: 'Quantitative Backtesting', path: '/backtesting', desc: 'Strategy backtesting engine' },
    { title: 'Reports & Export', path: '/reports', desc: 'Generated CSV/PDF analytics exports' },
    { title: 'Settings & Health', path: '/settings', desc: 'System configuration and health' },
  ];

  const filteredSearch = searchQuery.trim()
    ? searchItems.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.desc.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : searchItems;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans overflow-hidden">
      {/* Collapsible Sidebar */}
      <Sidebar
        open={sidebarOpen}
        collapsed={isCollapsed}
        onClose={() => setSidebarOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main App Layout */}
      <div
        className={`flex min-w-0 flex-1 flex-col h-screen transition-all duration-200 ease-in-out ${
          isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[280px]'
        }`}
      >
        {/* Sleek Topbar Navigation (60px height) */}
        <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#111111] px-5 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100 transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="truncate">Enterprise Platform</span>
              <span>/</span>
              <span className="font-semibold text-zinc-100 truncate">
                {pageTitleFromPath(location.pathname)}
              </span>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-sm mx-4 hidden md:block">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#161616] border border-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/10 transition-all shadow-xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" strokeWidth={1.5} />
                <span className="text-[11.5px]">Search projects, docs, or actions...</span>
              </div>
              <kbd className="text-[9.5px] bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/60 font-mono text-zinc-400">⌘K</kbd>
            </button>
          </div>

          {/* User Profile Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            <UserMenu />
          </div>
        </header>

        {/* Scrollable Content Workspace Area */}
        <main
          className={`flex-1 flex flex-col min-h-0 bg-[#0a0a0a] ${
            isFullBleedPage ? 'p-0 overflow-hidden' : 'px-6 py-5 overflow-y-auto'
          }`}
        >
          {isFullBleedPage ? (
            <div className="w-full h-full bg-[#141414] border-l border-white/[0.06] flex flex-col overflow-hidden">
              <Outlet />
            </div>
          ) : (
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      {/* ⌘K Global Search Command Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-xs px-4">
          <div className="fixed inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#121212] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-10">
            <div className="flex items-center px-3.5 border-b border-white/[0.06]">
              <Search className="w-3.5 h-3.5 text-zinc-400 mr-2.5 shrink-0" strokeWidth={1.5} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent py-3 outline-none text-xs text-zinc-100 placeholder:text-zinc-500"
                placeholder="Search projects, docs, or actions..."
              />
              <kbd
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-4 px-1 ml-2 text-[9.5px] font-mono text-zinc-400 bg-zinc-800 border border-zinc-700/60 rounded cursor-pointer"
              >
                ESC
              </kbd>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="ml-2 p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-1.5 max-h-[320px] overflow-y-auto space-y-0.5">
              {filteredSearch.length === 0 ? (
                <div className="p-5 text-center text-xs text-zinc-500">
                  <Command className="w-5 h-5 mx-auto mb-1.5 text-zinc-600" />
                  No results found for "{searchQuery}"
                </div>
              ) : (
                filteredSearch.map((item) => (
                  <div
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-2.5 rounded-lg hover:bg-white/[0.05] cursor-pointer transition-colors flex flex-col gap-0.5"
                  >
                    <span className="text-xs font-medium text-zinc-200">{item.title}</span>
                    <span className="text-[10.5px] text-zinc-500 truncate">{item.desc}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/datasets': 'Datasets',
  '/datamart': 'DataMart',
  '/datamart/query': 'Query Builder',
  '/datamart/analyses': 'Analyses',
  '/datamart/metrics': 'Metrics Catalog',
  '/datamart/dashboards': 'Dashboards',
  '/datamart/compare': 'Compare Datasets',
  '/backtesting': 'Quantitative Backtesting',
  '/ai-assistant': 'AI Assistant',
  '/knowledge-base': 'Knowledge Base',
  '/upload-center': 'Upload Center',
  '/reports': 'Reports & Export',
  '/settings': 'Settings & Health',
};

function pageTitleFromPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/datasets/')) return 'Datasets';
  if (pathname.startsWith('/datamart/analyses/')) return 'Analysis';
  if (pathname.startsWith('/datamart/dashboards/')) return 'Dashboard';
  return 'Workspace';
}
