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
        className="flex items-center gap-3 border-2 border-white bg-black px-3 py-1.5 hover:bg-ink-card transition-all rounded-md"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm border-2 border-lime bg-lime/10 text-xs font-bold text-lime">
          {initialsOf(user?.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[160px] truncate text-xs font-bold uppercase tracking-wider text-white">
            {user?.name}
          </span>
          <span className="block max-w-[160px] truncate text-[10px] uppercase font-bold text-muted">
            {user?.email}
          </span>
        </span>
        <ChevronDownIcon
          className={clsx('hidden h-4 w-4 text-white transition sm:block', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 border-2 border-white bg-ink-card p-2 shadow-brutal rounded-md"
        >
          <div className="border-b-2 border-white px-3 py-3">
            <p className="truncate text-sm font-bold uppercase tracking-wider text-white">{user?.name}</p>
            <p className="truncate text-xs text-muted font-bold">{user?.email}</p>
            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-lime bg-lime/10 border border-lime/20 px-2 py-0.5 w-fit rounded-sm">
              {user?.role}
            </p>
          </div>
          {signOutError ? (
            <p className="px-3 py-2 text-xs text-pink font-bold uppercase tracking-wider">{signOutError}</p>
          ) : null}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-pink hover:bg-pink/10 border-0"
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
