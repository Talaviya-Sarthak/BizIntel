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
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
          {initialsOf(user?.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[160px] truncate text-sm font-medium text-white">
            {user?.name}
          </span>
          <span className="block max-w-[160px] truncate text-xs text-slate-500">
            {user?.email}
          </span>
        </span>
        <ChevronDownIcon
          className={clsx('hidden h-4 w-4 text-slate-500 transition sm:block', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-surface-elevated p-2 shadow-2xl"
        >
          <div className="border-b border-white/10 px-3 py-3">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <p className="mt-1.5 text-[11px] uppercase tracking-wider text-slate-600">
              {user?.role}
            </p>
          </div>
          {signOutError ? (
            <p className="px-3 py-2 text-xs text-red-400">{signOutError}</p>
          ) : null}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-300"
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
