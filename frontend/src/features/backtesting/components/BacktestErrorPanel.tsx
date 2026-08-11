import { XCircleIcon } from '../../../components/ui/icons';
import { toApiError } from '../../../lib/api';
import { describeBacktestError } from '../utils/backtestErrors';

interface BacktestErrorPanelProps {
  error: unknown;
  className?: string;
}

/**
 * Renders a backtest failure as a clear, actionable panel: a title, the
 * technical reason, and a "what to do next" suggestion.
 */
export function BacktestErrorPanel({ error, className }: BacktestErrorPanelProps) {
  const view = describeBacktestError(toApiError(error));
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 ${className ?? ''}`}
    >
      <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-red-300">{view.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-red-200/70">{view.message}</p>
        <p className="mt-2 text-sm leading-relaxed text-red-200/90">
          <span className="font-semibold text-red-300">What to do: </span>
          {view.suggestion}
        </p>
      </div>
    </div>
  );
}
