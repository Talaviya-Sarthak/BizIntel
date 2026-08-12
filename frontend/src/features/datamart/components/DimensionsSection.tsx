import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { TrashIcon, PlusIcon, ColumnsIcon, HashIcon, CalendarIcon } from '../../../components/ui/icons';
import type { ColumnCategory, QueryDatasetSource, TimeGranularity } from '../types';
import {
  TIME_GRANULARITY_OPTIONS,
} from '../types';
import { collectColumns, type DimensionRow } from '../utils/queryBuilder';
import { isDateCategory } from '../utils/category';

interface DimensionsSectionProps {
  sources: QueryDatasetSource[];
  dimensions: DimensionRow[];
  onChange: (next: DimensionRow[]) => void;
}

export function DimensionsSection({ sources, dimensions, onChange }: DimensionsSectionProps) {
  const columns = collectColumns(sources);

  function add() {
    onChange([...dimensions, { id: `dim-${Date.now()}`, column: '', granularity: undefined }]);
  }

  function update(id: string, patch: Partial<DimensionRow>) {
    onChange(dimensions.map((dimension) => (dimension.id === id ? { ...dimension, ...patch } : dimension)));
  }

  function remove(id: string) {
    onChange(dimensions.filter((dimension) => dimension.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {dimensions.map((dimension) => {
          const selected = columns.find((column) => column.name === dimension.column);
          const isDate = selected ? isDateCategory(selected.category as ColumnCategory) : false;
          return (
            <div key={dimension.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Select
                  label="Column"
                  value={dimension.column}
                  onChange={(event) =>
                    update(dimension.id, {
                      column: event.target.value,
                      granularity: undefined,
                    })
                  }
                  options={[
                    { value: '', label: 'Select a column', disabled: true },
                    ...columns.map((column) => ({
                      value: column.name,
                      label: column.name + (column.datasetIds.length > 1 ? ' (ambiguous)' : ''),
                    })),
                  ]}
                />
              </div>
              {isDate ? (
                <div className="sm:w-44">
                  <Select
                    label="Group by"
                    value={dimension.granularity ?? ''}
                    onChange={(event) =>
                      update(dimension.id, {
                        granularity: (event.target.value || undefined) as TimeGranularity | undefined,
                      })
                    }
                    options={[
                      { value: '', label: 'No grouping', disabled: true },
                      ...TIME_GRANULARITY_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ]}
                  />
                </div>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove dimension"
                onClick={() => remove(dimension.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
      <Button variant="outline" size="sm" onClick={add} className="self-start">
        <PlusIcon className="h-4 w-4" />
        Add dimension
      </Button>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><ColumnsIcon className="h-3.5 w-3.5" /> Breakdown</span>
        <span className="flex items-center gap-1"><HashIcon className="h-3.5 w-3.5" /> Category</span>
        <span className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" /> Dates group by day/week/month/quarter/year</span>
      </div>
    </div>
  );
}