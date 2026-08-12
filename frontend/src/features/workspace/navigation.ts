import type { ComponentType } from 'react';
import {
  DashboardIcon,
  DatabaseZapIcon,
  FolderIcon,
  SettingsIcon,
  SparklesIcon,
  TrendingUpIcon,
} from '../../components/ui/icons';

export interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  soon?: boolean;
}

export interface NavSubItem {
  label: string;
  path: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
  subItems?: NavSubItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', path: '/dashboard', icon: DashboardIcon }],
  },
  {
    label: 'AI & Intelligence',
    items: [
      { label: 'AI Assistant', path: '/ai-assistant', icon: SparklesIcon },
      { label: 'Knowledge Base', path: '/knowledge-base', icon: FolderIcon },
      { label: 'Upload Center', path: '/upload-center', icon: FolderIcon },
      { label: 'Reports & Artifacts', path: '/reports', icon: DatabaseZapIcon },
    ],
  },
  {
    label: 'Analytics & Trading',
    items: [
      { label: 'DataMart', path: '/datamart', icon: DatabaseZapIcon },
      { label: 'Backtesting', path: '/backtesting', icon: TrendingUpIcon },
      { label: 'Datasets', path: '/datasets', icon: FolderIcon },
    ],
    subItems: [
      { label: 'Overview', path: '/datamart' },
      { label: 'Query builder', path: '/datamart/query' },
      { label: 'Analyses', path: '/datamart/analyses' },
      { label: 'Metrics', path: '/datamart/metrics' },
      { label: 'Dashboards', path: '/datamart/dashboards' },
      { label: 'Compare datasets', path: '/datamart/compare' },
    ],
  },
  {
    items: [{ label: 'Settings & Health', path: '/settings', icon: SettingsIcon }],
  },
];

export const SOON_PAGES: Record<string, { title: string; description: string }> = {};
