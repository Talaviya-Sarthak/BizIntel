import { createBrowserRouter } from 'react-router-dom';
import AuthContainer from '../features/auth/components/AuthContainer';
import { BacktestingPage } from '../features/backtesting/pages/BacktestingPage';
import { BacktestResultPage } from '../features/backtesting/pages/BacktestResultPage';
import { NewBacktestPage } from '../features/backtesting/pages/NewBacktestPage';
import { ContactPage } from '../features/contact/pages/ContactPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { DatasetsPage } from '../features/datasets/pages/DatasetsPage';
import { DatasetWorkspacePage } from '../features/datasets/pages/DatasetWorkspacePage';
import { DatasetUploadPage } from '../features/datasets/pages/DatasetUploadPage';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { AppShell } from '../features/workspace/components/AppShell';
import {
  AiAssistantPage,
  DataMartPage,
  SettingsPage,
} from '../features/workspace/pages/PlaceholderPages';
import { NotFoundPage } from '../pages/NotFoundPage';
import { GuestRoute, ProtectedRoute } from './guards';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
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
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/datasets', element: <DatasetsPage /> },
      { path: '/datasets/upload', element: <DatasetUploadPage /> },
      { path: '/datasets/:id', element: <DatasetWorkspacePage /> },
      { path: '/datamart', element: <DataMartPage /> },
      { path: '/backtesting', element: <BacktestingPage /> },
      { path: '/backtesting/new', element: <NewBacktestPage /> },
      { path: '/backtesting/:id', element: <BacktestResultPage /> },
      { path: '/ai-assistant', element: <AiAssistantPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
