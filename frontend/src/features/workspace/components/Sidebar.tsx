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
          className="fixed inset-0 z-30 bg-black/80 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r-2 border-white bg-ink-soft transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b-2 border-white px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-white bg-black p-2 text-white transition-all hover:bg-ink-card lg:hidden rounded-md"
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Workspace navigation">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label ?? `group-${groupIndex}`} className="mb-5">
              {group.label ? (
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
                  {group.label}
                </p>
              ) : null}
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/dashboard' || item.path === '/datasets'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center justify-between px-3 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-150 rounded-md border-2',
                          isActive
                            ? 'bg-lime text-black border-white shadow-none'
                            : 'text-white border-transparent hover:bg-ink-card hover:border-white/50 hover:translate-x-[2px] hover:translate-y-[2px]',
                        )
                      }
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4.5 w-4.5" />
                        {item.label}
                      </span>
                      {item.soon ? (
                        <span className="rounded-sm border border-yellow bg-yellow/10 px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider text-yellow">
                          Soon
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {group.subItems && group.subItems.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 border-l-2 border-white pl-4 ml-4">
                  {group.subItems.map((subItem) => (
                    <li key={subItem.path}>
                      <NavLink
                        to={subItem.path}
                        end={subItem.path === '/datamart'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          clsx(
                            'block py-1 text-xs font-bold uppercase tracking-wider transition-colors',
                            isActive
                              ? 'text-lime'
                              : 'text-muted hover:text-white',
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

        <div className="border-t-2 border-white p-4 bg-black">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Enterprise Intelligence · v0.2</p>
        </div>
      </aside>
    </>
  );
}
