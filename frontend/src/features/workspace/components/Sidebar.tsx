import { clsx } from 'clsx';
import { NavLink } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';
import { CloseIcon } from '../../../components/ui/icons';
import { NAV_GROUPS } from '../navigation';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-surface-elevated/60 backdrop-blur transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 lg:hidden"
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Workspace navigation">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label ?? `group-${groupIndex}`} className="mb-5">
              {group.label ? (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {group.label}
                </p>
              ) : null}
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/dashboard' || item.path === '/datasets'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition',
                          isActive
                            ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white',
                        )
                      }
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {item.soon ? (
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                          Soon
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {group.subItems && group.subItems.length > 0 ? (
                <ul className="mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3 ml-3">
                  {group.subItems.map((subItem) => (
                    <li key={subItem.path}>
                      <NavLink
                        to={subItem.path}
                        end={subItem.path === '/datamart'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          clsx(
                            'block rounded-md py-1.5 pl-3 text-xs font-medium transition',
                            isActive
                              ? 'text-cyan-300'
                              : 'text-slate-500 hover:text-white',
                          )
                        }
                      >
                        {subItem.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-slate-500">Enterprise Intelligence · v0.2</p>
        </div>
      </aside>
    </>
  );
}
