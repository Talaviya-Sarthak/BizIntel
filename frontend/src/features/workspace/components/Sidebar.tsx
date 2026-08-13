import { clsx } from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarNav } from '../../../components/ui/dashboard-sidebar';
import { CloseIcon } from '../../../components/ui/icons';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onOpenSearch?: () => void;
}

export function Sidebar({ open, collapsed, onClose, onOpenSearch }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSelect = (id: string, path?: string) => {
    if (id === 'search') {
      if (onOpenSearch) onOpenSearch();
      onClose();
      return;
    }
    if (path) {
      navigate(path);
      onClose();
    }
  };

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.06] bg-[#0d0d0d] transition-all duration-200 ease-in-out lg:translate-x-0',
          collapsed ? 'w-[72px]' : 'w-[280px]',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="lg:hidden flex h-12 items-center justify-between border-b border-white/[0.06] px-3">
          <span className="text-[11px] font-semibold text-zinc-200">BizIntel Workspace</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/[0.05]"
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <SidebarNav
            className="w-full h-full border-none bg-transparent"
            activeId={location.pathname}
            onSelect={handleSelect}
            collapsed={collapsed}
          />
        </div>
      </aside>
    </>
  );
}
