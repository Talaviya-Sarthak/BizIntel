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
  /** Modules landing in later phases still route, but render a placeholder. */
  soon?: boolean;
}

export interface NavSubItem {
  label: string;
  path: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
  /** Optional secondary links shown under the group's primary items. */
  subItems?: NavSubItem[];
}

/**
 * Canonical workspace navigation. All authenticated modules live here so the
 * platform reads as one unified product rather than disconnected apps.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', path: '/dashboard', icon: DashboardIcon }],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'DataMart', path: '/datamart', icon: DatabaseZapIcon },
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
    items: [
      { label: 'Backtesting', path: '/backtesting', icon: TrendingUpIcon },
      { label: 'AI Assistant', path: '/ai-assistant', icon: SparklesIcon, soon: true },
      { label: 'Datasets', path: '/datasets', icon: FolderIcon },
      { label: 'Settings', path: '/settings', icon: SettingsIcon, soon: true },
    ],
  },
];

/** Workspace pages that are placeholder-only until their module ships. */
export const SOON_PAGES: Record<string, { title: string; description: string }> = {
  '/ai-assistant': {
    title: 'AI Assistant',
    description:
      'Natural-language questions answered from your enterprise datasets. Coming in the AI Assistant phase.',
  },
  '/settings': {
    title: 'Settings',
    description: 'Manage your profile and workspace preferences.',
  },
};
