import { TrendingUp, Activity, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import type { StrategyMetadata } from '../types';

const STRATEGY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sma_crossover: TrendingUp,
  rsi_momentum: Activity,
  bollinger_bands: Layers,
};

interface StrategyCardProps {
  strategy: StrategyMetadata;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function StrategyCard({ strategy, selected, onSelect }: StrategyCardProps) {
  const Icon = STRATEGY_ICONS[strategy.id] ?? TrendingUp;

  return (
    <button
      type="button"
      onClick={() => onSelect(strategy.id)}
      className={clsx(
        'rounded-2xl border p-6 text-left transition-all',
        selected
          ? 'border-cyan-400/40 bg-cyan-400/[0.08] ring-1 ring-cyan-400/20'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
      )}
    >
      <div
        className={clsx(
          'inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1',
          selected
            ? 'bg-cyan-400/20 text-cyan-300 ring-cyan-400/30'
            : 'bg-white/5 text-slate-400 ring-white/10'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-white">{strategy.name}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        {strategy.description}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider',
            selected
              ? 'bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20'
              : 'bg-white/5 text-slate-500 ring-1 ring-white/10'
          )}
        >
          {strategy.parameters.length} params
        </span>
        {selected && (
          <span className="text-[10px] font-medium text-cyan-400">Selected</span>
        )}
      </div>
    </button>
  );
}
