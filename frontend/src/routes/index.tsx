import { createBrowserRouter } from 'react-router-dom';
import AuthContainer from '../features/auth/components/AuthContainer';
import { BacktestingPage } from '../features/backtesting/pages/BacktestingPage';
import { BacktestResultPage } from '../features/backtesting/pages/BacktestResultPage';
import { NewBacktestPage } from '../features/backtesting/pages/NewBacktestPage';
import { ContactPage } from '../features/contact/pages/ContactPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { DataMartOverviewPage } from '../features/datamart/pages/DataMartOverviewPage';
import { QueryBuilderPage } from '../features/datamart/pages/QueryBuilderPage';
import { AnalysesPage } from '../features/datamart/pages/AnalysesPage';
import { AnalysisDetailPage } from '../features/datamart/pages/AnalysisDetailPage';
import { MetricsPage } from '../features/datamart/pages/MetricsPage';
import { DashboardsPage } from '../features/datamart/pages/DashboardsPage';
import { DashboardDetailPage } from '../features/datamart/pages/DashboardDetailPage';
import { ComparisonPage } from '../features/datamart/pages/ComparisonPage';
import { DatasetsPage } from '../features/datasets/pages/DatasetsPage';
import { DatasetWorkspacePage } from '../features/datasets/pages/DatasetWorkspacePage';
import { DatasetUploadPage } from '../features/datasets/pages/DatasetUploadPage';
import { AnalysisDashboardPage } from '../features/datasets/pages/AnalysisDashboardPage';
import { LandingPage } from '../features/landing/pages/LandingPage';
import { AppShell } from '../features/workspace/components/AppShell';

import { AiAssistantPage } from '../pages/AiAssistantPage';
import { KnowledgeBasePage } from '../pages/KnowledgeBasePage';
import { UploadCenterPage } from '../pages/UploadCenterPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
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
      { path: '/datasets/:id/analysis', element: <AnalysisDashboardPage /> },
      { path: '/datamart', element: <DataMartOverviewPage /> },
      { path: '/datamart/query', element: <QueryBuilderPage /> },
      { path: '/datamart/analyses', element: <AnalysesPage /> },
      { path: '/datamart/analyses/:id', element: <AnalysisDetailPage /> },
      { path: '/datamart/metrics', element: <MetricsPage /> },
      { path: '/datamart/dashboards', element: <DashboardsPage /> },
      { path: '/datamart/dashboards/:id', element: <DashboardDetailPage /> },
      { path: '/datamart/compare', element: <ComparisonPage /> },
      { path: '/backtesting', element: <BacktestingPage /> },
      { path: '/backtesting/new', element: <NewBacktestPage /> },
      { path: '/backtesting/:id', element: <BacktestResultPage /> },
      { path: '/ai-assistant', element: <AiAssistantPage /> },
      { path: '/knowledge-base', element: <KnowledgeBasePage /> },
      { path: '/upload-center', element: <UploadCenterPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
