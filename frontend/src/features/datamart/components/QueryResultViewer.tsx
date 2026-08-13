import { useState } from 'react';
import { clsx } from 'clsx';
import { EmptyState } from '../../../components/ui/EmptyState';
import { RowsIcon, ColumnsIcon, InfoIcon } from '../../../components/ui/icons';
import { ResultTable } from './ResultTable';
import { ResultChart } from './ResultChart';
import type { DataMartQueryResult } from '../types';

interface QueryResultViewerProps {
  result: DataMartQueryResult;
  footer?: React.ReactNode;
}

export function QueryResultViewer({ result, footer }: QueryResultViewerProps) {
  const [view, setView] = useState<'table' | 'chart'>('chart');
  const hasChart = result.rows.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#161616] p-1">
          <button
            type="button"
            onClick={() => setView('table')}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              view === 'table'
                ? 'bg-white/10 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
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
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40',
              view === 'chart'
                ? 'bg-white/10 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <ColumnsIcon className="h-3.5 w-3.5" />
            Chart
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <InfoIcon className="h-3.5 w-3.5" />
          {result.totalRows.toLocaleString('en-US')} rows · {result.executionTimeMs} ms
        </p>
      </div>

      {view === 'table' ? (
        <ResultTable result={result} />
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-[#181818] p-4 shadow-sm">
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