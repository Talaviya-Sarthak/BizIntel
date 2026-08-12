import { SparklesIcon } from '@/components/ui/icons';
import { ComingSoon } from '@/features/workspace/components/ComingSoon';

export function AiAssistantPage() {
  return (
    <ComingSoon
      icon={SparklesIcon}
      title="AI Assistant"
      description="Ask natural-language questions about your datasets and get instant, sourced answers."
    />
  );
}