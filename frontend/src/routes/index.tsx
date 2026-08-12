import { createBrowserRouter } from 'react-router-dom';
import AuthContainer from '../features/auth/components/AuthContainer';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { DatasetsPage } from '../features/datasets/pages/DatasetsPage';
import { BacktestListPage } from '../features/backtesting/pages/BacktestListPage';
import { BacktestCreatePage } from '../features/backtesting/pages/BacktestCreatePage';
import { BacktestDetailPage } from '../features/backtesting/pages/BacktestDetailPage';
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
    path: '/datasets',
    element: (
      <ProtectedRoute>
        <DatasetsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/backtesting',
    element: (
      <ProtectedRoute>
        <BacktestListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/backtesting/new',
    element: (
      <ProtectedRoute>
        <BacktestCreatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/backtesting/:id',
    element: (
      <ProtectedRoute>
        <BacktestDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
