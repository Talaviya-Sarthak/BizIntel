import { useState } from 'react';
import { clsx } from 'clsx';
import { EmptyState } from '../../../components/ui/EmptyState';
import { RowsIcon, ColumnsIcon, InfoIcon } from '../../../components/ui/icons';
import { ResultTable } from './ResultTable';
import { ResultChart } from './ResultChart';
import type { DataMartQueryResult } from '../types';

interface QueryResultViewerProps {
  result: DataMartQueryResult;
  /** Optional summary/sidebar to render next to the toggle row. */
  footer?: React.ReactNode;
}

/**
 * Default result presentation for DataMart: a Table/Chart toggle plus a meta
 * footer (total rows, execution time, truncation) and the recommendation note.
 */
export function QueryResultViewer({ result, footer }: QueryResultViewerProps) {
  const [view, setView] = useState<'table' | 'chart'>('chart');
  const hasChart = result.rows.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
          <button
            type="button"
            onClick={() => setView('table')}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
              view === 'table'
                ? 'bg-cyan-400/15 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <RowsIcon className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            type="button"
            onClick={() => setView('chart')}
            disabled={!hasChart}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
              view === 'chart'
                ? 'bg-cyan-400/15 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <ColumnsIcon className="h-3.5 w-3.5" />
            Chart
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <InfoIcon className="h-3.5 w-3.5" />
          {result.totalRows.toLocaleString('en-US')} rows · {result.executionTimeMs} ms
        </p>
      </div>

      {view === 'table' ? (
        <ResultTable result={result} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <ResultChart result={result} />
        </div>
      )}

      {footer ? footer : null}
    </div>
  );
}

export function EmptyResultState() {
  return (
    <EmptyState
      icon={RowsIcon}
      title="No query has been run yet"
      description="Build a query on the left, then press Run to see results as a table or a chart."
    />
  );
}