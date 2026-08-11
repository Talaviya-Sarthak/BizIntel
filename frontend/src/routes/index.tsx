import { createBrowserRouter } from 'react-router-dom';
import AuthContainer from '../features/auth/components/AuthContainer';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { GuestRoute, ProtectedRoute } from './guards';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/signin',
    element: (
      <GuestRoute>
        <AuthContainer initialMode="login" />
      </GuestRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestRoute>
        <AuthContainer initialMode="signup" />
      </GuestRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestRoute>
        <AuthContainer initialMode="forgot-password" />
      </GuestRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
