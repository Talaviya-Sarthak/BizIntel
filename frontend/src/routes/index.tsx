import { createBrowserRouter } from 'react-router-dom';
import { SignInPage } from '../features/auth/pages/SignInPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
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
        <SignInPage />
      </GuestRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestRoute>
        <SignUpPage />
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
