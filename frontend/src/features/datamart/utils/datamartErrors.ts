/**
 * Turns a DataMart API error into a user-facing explanation: a short title,
 * the technical message, and an actionable suggestion.
 *
 * Server-provided `suggestion` wins when present; otherwise a per-code
 * fallback keeps the UI helpful even for codes we do not map explicitly.
 */
export interface DataMartErrorView {
  title: string;
  message: string;
  suggestion: string;
}

const CODE_FALLBACKS: Record<string, Omit<DataMartErrorView, 'message'>> = {
  DATAMART_DATASET_NOT_FOUND: {
    title: 'Dataset not found',
    suggestion: 'Pick a dataset from your library and try again.',
  },
  DATAMART_DATASET_NOT_READY: {
    title: 'Dataset is not ready',
    suggestion: 'Wait for the dataset to finish processing, then try again.',
  },
  DATAMART_COLUMN_NOT_FOUND: {
    title: 'Column not found',
    suggestion: 'Choose a column from one of the selected datasets.',
  },
  DATAMART_AMBIGUOUS_COLUMN: {
    title: 'Ambiguous column',
    suggestion:
      'That column name exists in more than one selected dataset. Rename it in a dataset, or query the datasets separately.',
  },
  DATAMART_INVALID_QUERY: {
    title: 'Invalid query',
    suggestion: 'Review the query definition and adjust the highlighted parts.',
  },
  DATAMART_INVALID_FILTER: {
    title: 'Invalid filter',
    suggestion: 'Check the filter values and operators against the column types.',
  },
  DATAMART_INVALID_AGGREGATION: {
    title: 'Invalid aggregation',
    suggestion: 'Choose an aggregation that matches the metric column type.',
  },
  DATAMART_INVALID_JOIN: {
    title: 'Invalid join',
    suggestion: 'Make sure both join sides reference datasets in the query and matching columns.',
  },
  DATAMART_INVALID_METRIC: {
    title: 'Invalid metric',
    suggestion: 'Review the metric definition or formula and adjust it.',
  },
  DATAMART_INVALID_SORT: {
    title: 'Invalid sort',
    suggestion: 'Sort only by dimensions and metrics that are part of the query.',
  },
  DATAMART_QUERY_TIMEOUT: {
    title: 'Query timed out',
    suggestion: 'Simplify the query, add filters, or reduce the result limit.',
  },
  DATAMART_QUERY_FAILED: {
    title: 'Query failed',
    suggestion: 'The underlying engine reported an error. Review the query and try again.',
  },
  DATAMART_LIMIT_EXCEEDED: {
    title: 'Result limit exceeded',
    suggestion: 'Reduce the limit or offset used by the query.',
  },
  DATAMART_ACCESS_DENIED: {
    title: 'Access denied',
    suggestion: 'This resource belongs to another workspace.',
  },
  DATAMART_NOT_FOUND: {
    title: 'Not found',
    suggestion: 'The resource may have been deleted.',
  },
};

const DEFAULT_VIEW: Omit<DataMartErrorView, 'message'> = {
  title: 'DataMart request failed',
  suggestion: 'Review your configuration and try again.',
};

export function describeDataMartError(error: {
  code?: string;
  message?: string;
  suggestion?: string;
}): DataMartErrorView {
  const code = error.code ?? 'UNKNOWN_ERROR';
  const fallback = CODE_FALLBACKS[code] ?? DEFAULT_VIEW;
  return {
    title: fallback.title,
    message: error.message || 'An unexpected error occurred',
    suggestion: error.suggestion || fallback.suggestion,
  };
}