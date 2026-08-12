import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { TrashIcon, PlusIcon } from '../../../components/ui/icons';
import type { SortRow } from '../utils/queryBuilder';

function ArrowUpIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} aria-hidden="true">
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

interface SortsSectionProps {
  /** Output column names: dimension columns + metric aliases. */
  columns: { value: string; label: string }[];
  sorts: SortRow[];
  onChange: (next: SortRow[]) => void;
}

export function SortsSection({ columns, sorts, onChange }: SortsSectionProps) {
  function add() {
    onChange([...sorts, { id: `sort-${Date.now()}`, column: '', direction: 'asc' }]);
  }

  function update(id: string, patch: Partial<SortRow>) {
    onChange(sorts.map((sort) => (sort.id === id ? { ...sort, ...patch } : sort)));
  }

  function remove(id: string) {
    onChange(sorts.filter((sort) => sort.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {sorts.length === 0 ? (
        <p className="text-sm text-slate-500">
          No sorting — rows come back in group order. Sort only by columns in the result.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorts.map((sort) => (
            <div
              key={sort.id}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <Select
                  label="Column"
                  value={sort.column}
                  onChange={(event) => update(sort.id, { column: event.target.value })}
                  options={[{ value: '', label: 'Select an output column', disabled: true }, ...columns]}
                />
              </div>
              <div className="sm:w-40">
                <Select
                  label="Direction"
                  value={sort.direction}
                  onChange={(event) =>
                    update(sort.id, { direction: event.target.value as 'asc' | 'desc' })
                  }
                  options={[
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' },
                  ]}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove sort"
                onClick={() => remove(sort.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" onClick={add} className="self-start">
        <PlusIcon className="h-4 w-4" />
        Add sort
      </Button>
      <p className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><ArrowUpIcon className="h-3.5 w-3.5" /> asc</span>
        <span className="flex items-center gap-1"><ArrowDownIcon className="h-3.5 w-3.5" /> desc</span>
      </p>
    </div>
  );
}