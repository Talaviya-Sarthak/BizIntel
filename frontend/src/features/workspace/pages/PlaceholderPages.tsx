import { ComingSoon } from '../components/ComingSoon';
import {
  SettingsIcon,
  SparklesIcon,
  TrendingUpIcon,
} from '../../../components/ui/icons';

export function BacktestingPage() {
  return (
    <ComingSoon
      icon={TrendingUpIcon}
      moduleName="Backtesting"
      title="Backtesting workspace coming soon"
      description="Run historical strategies against your enterprise datasets, inspect performance, and compare outcomes. This module lands in a later development phase."
    />
  );
}

export function AiAssistantPage() {
  return (
    <ComingSoon
      icon={SparklesIcon}
      moduleName="AI Assistant"
      title="AI Assistant coming soon"
      description="Ask natural-language questions about your datasets and get instant, sourced answers. This module lands in a later development phase."
    />
  );
}

export function SettingsPage() {
  return (
    <ComingSoon
      icon={SettingsIcon}
      moduleName="Settings"
      title="Settings coming soon"
      description="Manage your profile, workspace preferences, and API access. This module lands in a later development phase."
    />
  );
}
