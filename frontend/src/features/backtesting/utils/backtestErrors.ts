/**
 * Turns a backtest API error into a user-facing explanation: a short title,
 * the technical message, and an actionable suggestion (what to do next).
 *
 * Server-provided `suggestion` wins when present; otherwise a per-code
 * fallback keeps the UI helpful even for codes we do not map explicitly.
 */
export interface BacktestErrorView {
  title: string;
  message: string;
  suggestion: string;
}

const CODE_FALLBACKS: Record<string, Omit<BacktestErrorView, 'message'>> = {
  BACKTEST_DATASET_NOT_FOUND: {
    title: 'Dataset not found',
    suggestion: 'Pick a dataset from your library and try again.',
  },
  BACKTEST_DATASET_NOT_READY: {
    title: 'Dataset is not ready',
    suggestion: 'Wait for the dataset to finish processing, then try again.',
  },
  BACKTEST_INVALID_STRATEGY: {
    title: 'Unknown strategy',
    suggestion: 'Choose a strategy from the list and try again.',
  },
  BACKTEST_INVALID_PARAMETER: {
    title: 'Invalid strategy parameters',
    suggestion: 'Review the highlighted strategy parameters and adjust them.',
  },
  BACKTEST_DATASET_NOT_COMPATIBLE: {
    title: 'Dataset is not market data',
    suggestion:
      'Choose a dataset that contains market data columns: date, open, high, low, and close (OHLCV).',
  },
  BACKTEST_INVALID_DATE_RANGE: {
    title: 'Invalid date range',
    suggestion: 'Make sure the start date is on or before the end date.',
  },
  BACKTEST_INVALID_MARKET_DATA: {
    title: 'Invalid market data',
    suggestion:
      'The dataset contains invalid rows. Check that prices are positive and timestamps are unique and chronological.',
  },
  BACKTEST_INSUFFICIENT_DATA: {
    title: 'Not enough data',
    suggestion:
      'Extend the date range or use a dataset with more history. The message below shows the available dates.',
  },
};

const DEFAULT_VIEW: Omit<BacktestErrorView, 'message'> = {
  title: 'Backtest failed',
  suggestion: 'Review your configuration and try again.',
};

export function describeBacktestError(
  error: { code?: string; message?: string; suggestion?: string },
): BacktestErrorView {
  const code = error.code ?? 'UNKNOWN_ERROR';
  const fallback = CODE_FALLBACKS[code] ?? DEFAULT_VIEW;
  return {
    title: fallback.title,
    message: error.message || 'An unexpected error occurred',
    suggestion: error.suggestion || fallback.suggestion,
  };
}
