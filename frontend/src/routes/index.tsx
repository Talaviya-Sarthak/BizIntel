import { createBrowserRouter } from 'react-router-dom';
import { SignInPage } from '../features/auth/pages/SignInPage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { DatasetsPage } from '../features/datasets/pages/DatasetsPage';
import { DatasetWorkspacePage } from '../features/datasets/pages/DatasetWorkspacePage';
import { DatasetUploadPage } from '../features/datasets/pages/DatasetUploadPage';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { AppShell } from '../features/workspace/components/AppShell';
import {
  AiAssistantPage,
  BacktestingPage,
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
      { path: '/ai-assistant', element: <AiAssistantPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
