import { useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import { clsx } from 'clsx';
import {
  DatabaseIcon,
  PlayIcon,
  SearchIcon,
  SparklesIcon,
  TrendingUpIcon,
  UploadIcon,
} from '../../../components/ui/icons';

interface ActionItem {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  soon?: boolean;
}

const ACTIONS: ActionItem[] = [
  {
    label: 'Upload Dataset',
    description: 'Ingest a CSV into the dataset registry.',
    icon: UploadIcon,
    href: '/datasets/upload',
  },
  {
    label: 'Explore Data',
    description: 'Browse and inspect your datasets.',
    icon: SearchIcon,
    href: '/datasets',
  },
  {
    label: 'Run Analysis',
    description: 'Query datasets with DataMart analytics.',
    icon: DatabaseIcon,
    soon: true,
  },
  {
    label: 'Open Backtesting',
    description: 'Test strategies against historical data.',
    icon: TrendingUpIcon,
    soon: true,
  },
  {
    label: 'Ask AI',
    description: 'Get answers from your enterprise data.',
    icon: SparklesIcon,
    soon: true,
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ACTIONS.map((action) => {
        const enabled = Boolean(action.href);
        return (
          <button
            key={action.label}
            type="button"
            disabled={!enabled}
            onClick={() => action.href && navigate(action.href)}
            className={clsx(
              'flex items-start gap-3 border-2 border-white bg-ink-card p-4 text-left transition-all duration-150 rounded-md',
              enabled
                ? 'cursor-pointer shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'
                : 'cursor-not-allowed opacity-60',
            )}
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-2 border-white bg-black text-white rounded-md">
              <action.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                {action.label}
                {action.soon ? (
                  <span className="rounded-sm border border-yellow bg-yellow/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-yellow">
                    Soon
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted font-semibold">
                {action.description}
              </span>
            </span>
            {enabled ? <PlayIcon className="ml-auto h-4 w-4 shrink-0 text-white stroke-[2.5]" /> : null}
          </button>
        );
      })}
    </div>
  );
}
