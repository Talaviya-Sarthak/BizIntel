import { SettingsIcon } from '@/components/ui/icons';
import { ComingSoon } from '@/features/workspace/components/ComingSoon';

export function SettingsPage() {
  return (
    <ComingSoon
      icon={SettingsIcon}
      title="Settings"
      description="Manage your profile, workspace preferences, and API access."
    />
  );
}