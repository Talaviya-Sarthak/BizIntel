import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../../components/ui/Button';
import { ChevronRightIcon, SearchIcon } from '../../../../components/ui/icons';
import { SkeletonTable } from '../../../../components/ui/Skeleton';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { useFilteredRows } from '../../hooks/useDatasetAnalytics';
import type { AnalyticsColumn, ExplorerRequest, FilterNode } from '../../analytics/types';
import { DataTable } from './DataTable';
import { FilterBuilder } from './FilterBuilder';
import { formatNumber } from '../../../../utils/format';

const PAGE_SIZE = 50;

interface DataExplorerSectionProps {
  datasetId: string;
  columns: AnalyticsColumn[];
}

/** Interactive row explorer: filters + search + sort + pagination. */
export function DataExplorerSection({ datasetId, columns }: DataExplorerSectionProps) {
  const [filters, setFilters] = useState<FilterNode | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filters, debouncedSearch, sortColumn, sortDirection]);

  const request: ExplorerRequest = useMemo(
    () => ({
      filters: filters ?? undefined,
      search: debouncedSearch ? { term: debouncedSearch } : undefined,
      sort: sortColumn ? { column: sortColumn, direction: sortDirection } : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [filters, debouncedSearch, sortColumn, sortDirection, page],
  );

  const rowsQuery = useFilteredRows(datasetId, request);

  const resultColumns = useMemo(
    () => columns.map((column) => ({ key: column.name, label: column.name })),
    [columns],
  );

  const hasMore = rowsQuery.data ? rowsQuery.data.page * PAGE_SIZE < rowsQuery.data.total : false;
  const hasPrev = page > 1;

  return (
    <div className="flex flex-col gap-4">
      <FilterBuilder columns={columns} onChange={setFilters} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="h-9 w-full rounded-lg border border-white/10 bg-slate-900 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
            placeholder="Search across all columns…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search rows"
          />
        </div>

        <select
          className="h-9 rounded-lg border border-white/10 bg-slate-900 px-2.5 text-sm text-slate-200 focus:border-cyan-400/50 focus:outline-none"
          value={sortColumn}
          onChange={(event) => setSortColumn(event.target.value)}
          aria-label="Sort column"
        >
          <option value="">No sorting</option>
          {columns.map((column) => (
            <option key={column.name} value={column.name}>
              Sort by {column.name}
            </option>
          ))}
        </select>
        {sortColumn ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        ) : null}
      </div>

      <div className="text-xs text-slate-500">
        {rowsQuery.data
          ? `${formatNumber(rowsQuery.data.total)} matching rows · page ${rowsQuery.data.page} of ${Math.max(1, Math.ceil(rowsQuery.data.total / PAGE_SIZE))}`
          : `${formatNumber(columns.length)} columns available`}
      </div>

      {rowsQuery.isLoading ? (
        <SkeletonTable rows={8} cols={Math.min(columns.length, 5)} />
      ) : rowsQuery.isError ? (
        <ErrorState
          message={rowsQuery.error?.message ?? 'Could not load rows.'}
          onRetry={() => rowsQuery.refetch()}
        />
      ) : rowsQuery.data && rowsQuery.data.rows.length > 0 ? (
        <>
          <DataTable columns={resultColumns} rows={rowsQuery.data.rows} highlightSearch={debouncedSearch} />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setPage(page - 1)}
            >
              <ChevronRightIcon className="h-4 w-4 rotate-180" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <EmptyState
          title="No rows match"
          description="Adjust or clear your filters to see more data."
        />
      )}
    </div>
  );
}
