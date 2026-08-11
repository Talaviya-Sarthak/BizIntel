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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ACTIONS.map((action) => {
        const enabled = Boolean(action.href);
        return (
          <button
            key={action.label}
            type="button"
            disabled={!enabled}
            onClick={() => action.href && navigate(action.href)}
            className={clsx(
              'flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition',
              enabled
                ? 'cursor-pointer hover:border-cyan-400/30 hover:bg-white/[0.05]'
                : 'cursor-not-allowed opacity-70',
            )}
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-300 ring-1 ring-white/10">
              <action.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                {action.label}
                {action.soon ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                    Coming soon
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                {action.description}
              </span>
            </span>
            {enabled ? <PlayIcon className="ml-auto h-4 w-4 shrink-0 text-slate-600" /> : null}
          </button>
        );
      })}
    </div>
  );
}
