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
    <div className="flex flex-col gap-5 bg-black">
      <FilterBuilder columns={columns} onChange={setFilters} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
          <input
            className="w-full border-2 border-white bg-black pl-10 pr-3.5 py-2 text-sm text-white placeholder:text-muted outline-none transition-all rounded-md focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
            placeholder="Search across all columns…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search rows"
          />
        </div>

        <select
          className="border-2 border-white bg-black px-3 py-2 text-sm text-white outline-none transition-all rounded-md font-bold uppercase tracking-wider focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
          value={sortColumn}
          onChange={(event) => setSortColumn(event.target.value)}
          aria-label="Sort column"
        >
          <option value="" className="bg-black text-white">No sorting</option>
          {columns.map((column) => (
            <option key={column.name} value={column.name} className="bg-black text-white">
              Sort by {column.name}
            </option>
          ))}
        </select>
        {sortColumn ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        ) : null}
      </div>

      <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
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
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setPage(page - 1)}
            >
              <ChevronRightIcon className="h-4.5 w-4.5 rotate-180" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRightIcon className="h-4.5 w-4.5" />
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
