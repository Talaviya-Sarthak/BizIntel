import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

/**
 * Guards protected routes. Unauthenticated users are redirected to the
 * sign-in page, preserving the intended destination.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullPageLoader />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/**
 * Redirects already-authenticated users away from auth pages
 * (e.g. /signin, /signup) to the dashboard.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <FullPageLoader />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-deep">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="md" />
        <p className="text-sm text-slate-500">Loading</p>
      </div>
    </div>
  );
}
