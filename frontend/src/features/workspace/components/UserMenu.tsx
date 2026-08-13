import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ChevronDownIcon, LogoutIcon } from '../../../components/ui/icons';
import { useAuth } from '../../../hooks/useAuth';
import { toApiError } from '../../../lib/api';
import { initialsOf } from '../../../utils/format';
import { clsx } from 'clsx';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      navigate('/signin', { replace: true });
    } catch (error) {
      setSignOutError(toApiError(error).message);
      setSigningOut(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-xl px-2.5 py-1.5 transition hover:bg-white/[0.05]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-100 border border-zinc-700/80 shadow-sm">
          {initialsOf(user?.name) || 'U'}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-xs font-medium text-zinc-100 leading-tight">
            {user?.name || 'Enterprise User'}
          </span>
          <span className="block max-w-[140px] truncate text-[11px] text-zinc-400 leading-tight">
            {user?.email || 'user@enterprise.ai'}
          </span>
        </span>
        <ChevronDownIcon
          className={clsx('hidden h-3.5 w-3.5 text-zinc-400 transition sm:block', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-white/[0.08] bg-[#181818] p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="border-b border-white/[0.06] px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-zinc-100">{user?.name || 'Enterprise User'}</p>
            <p className="truncate text-[11px] text-zinc-400">{user?.email || 'user@enterprise.ai'}</p>
            <span className="mt-2 inline-block rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
              {user?.role || 'PRO PLAN'}
            </span>
          </div>
          {signOutError ? (
            <p className="px-3 py-2 text-xs text-red-400">{signOutError}</p>
          ) : null}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-zinc-300 hover:text-white hover:bg-white/[0.05]"
              onClick={handleSignOut}
              loading={signingOut}
            >
              <LogoutIcon className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
