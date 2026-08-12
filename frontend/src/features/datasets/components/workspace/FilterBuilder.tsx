import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Button } from '../../../../components/ui/Button';
import { FilterIcon, PlusIcon, CloseIcon } from '../../../../components/ui/icons';
import {
  FILTER_OPERATORS,
  type AnalyticsColumn,
  type FilterConjunction,
  type FilterNode,
  type FilterOperator,
} from '../../analytics/types';

interface FilterRow {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
  value2: string;
}

interface FilterBuilderProps {
  columns: AnalyticsColumn[];
  onChange: (filters: FilterNode | null) => void;
}

const NO_VALUE_OPERATORS: FilterOperator[] = ['is_null', 'is_not_null'];

function blankRow(): FilterRow {
  return { id: crypto.randomUUID(), column: '', operator: 'eq', value: '', value2: '' };
}

/** Builds a flat AND/OR group of filter conditions from local row state. */
function buildNode(rows: FilterRow[], conjunction: FilterConjunction): FilterNode | null {
  const conditions = rows.filter((row) => row.column);
  if (conditions.length === 0) return null;

  const nodes = conditions.map((row) => {
    if (row.operator === 'is_null' || row.operator === 'is_not_null') {
      return { column: row.column, operator: row.operator };
    }
    if (row.operator === 'between') {
      return { column: row.column, operator: row.operator, value: parseValue(row.value), value2: parseValue(row.value2) };
    }
    return { column: row.column, operator: row.operator, value: parseValue(row.value) };
  });

  return nodes.length === 1 ? nodes[0]! : { conjunction, nodes };
}

function parseValue(raw: string): unknown {
  if (raw === '') return undefined;
  if (!Number.isNaN(Number(raw)) && raw.trim() !== '') {
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) return numeric;
  }
  if (raw.toLowerCase() === 'true') return true;
  if (raw.toLowerCase() === 'false') return false;
  return raw;
}

export function FilterBuilder({ columns, onChange }: FilterBuilderProps) {
  const [rows, setRows] = useState<FilterRow[]>(() => [blankRow()]);
  const [conjunction, setConjunction] = useState<FilterConjunction>('AND');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onChange(rows.length > 0 && rows.some((r) => r.column) ? buildNode(rows, conjunction) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, conjunction]);

  function updateRow(id: string, patch: Partial<FilterRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  const selectedOperators = (columnName: string): FilterOperator[] => {
    const column = columns.find((c) => c.name === columnName);
    if (!column) return FILTER_OPERATORS as unknown as FilterOperator[];
    if (column.category === 'string' || column.category === 'uuid') {
      return ['eq', 'neq', 'contains', 'not_contains', 'in', 'not_in', 'is_null', 'is_not_null'];
    }
    return FILTER_OPERATORS as unknown as FilterOperator[];
  };

  const hasActive = rows.some((row) => row.column);

  return (
    <div className="border-2 border-white bg-ink-card rounded-md shadow-brutal-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4.5 w-4.5 text-lime" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Filters</h3>
          {hasActive ? (
            <span className="border border-lime text-lime bg-lime/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm">
              {rows.filter((r) => r.column).length} active
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'Edit filters'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRows([blankRow()])}
            disabled={!hasActive}
            className="border-0"
          >
            Clear
          </Button>
        </div>
      </div>

      {open ? (
        <div className="flex flex-col gap-4 border-t-2 border-white px-5 py-4 bg-black">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3">
              <select
                className="border-2 border-white bg-black px-3 py-1.5 text-xs text-white outline-none transition-all rounded-md font-bold uppercase tracking-wider focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
                value={row.column}
                onChange={(event) => updateRow(row.id, { column: event.target.value })}
                aria-label="Column"
              >
                <option value="" className="bg-black text-white">Select column…</option>
                {columns.map((column) => (
                  <option key={column.name} value={column.name} className="bg-black text-white">
                    {column.name}
                  </option>
                ))}
              </select>

              <select
                className="border-2 border-white bg-black px-3 py-1.5 text-xs text-white outline-none transition-all rounded-md font-bold uppercase tracking-wider focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
                value={row.operator}
                disabled={!row.column}
                onChange={(event) =>
                  updateRow(row.id, { operator: event.target.value as FilterOperator })
                }
                aria-label="Operator"
              >
                {selectedOperators(row.column).map((operator) => (
                  <option key={operator} value={operator} className="bg-black text-white">
                    {operator.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              {!NO_VALUE_OPERATORS.includes(row.operator) ? (
                <>
                  <input
                    className="border-2 border-white bg-black px-3 py-1.5 text-xs text-white outline-none transition-all rounded-md focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
                    placeholder={row.operator === 'between' ? 'From' : 'Value'}
                    value={row.value}
                    disabled={!row.column}
                    onChange={(event) => updateRow(row.id, { value: event.target.value })}
                    aria-label="Value"
                  />
                  {row.operator === 'between' ? (
                    <input
                      className="border-2 border-white bg-black px-3 py-1.5 text-xs text-white outline-none transition-all rounded-md focus:border-lime focus:shadow-[4px_4px_0px_#C6FF00]"
                      placeholder="To"
                      value={row.value2}
                      disabled={!row.column}
                      onChange={(event) => updateRow(row.id, { value2: event.target.value })}
                      aria-label="Upper value"
                    />
                  ) : null}
                </>
              ) : null}

              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="inline-flex h-9 w-9 items-center justify-center text-muted hover:text-pink transition-colors rounded-sm"
                aria-label="Remove condition"
              >
                <CloseIcon className="h-4.5 w-4.5" />
              </button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-4 border-t border-white/20 pt-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              Combine with:
              <span className="inline-flex overflow-hidden border-2 border-white rounded-sm">
                {(['AND', 'OR'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConjunction(c)}
                    className={clsx(
                      'px-3 py-1 text-xs font-bold transition-all duration-150',
                      conjunction === c
                        ? 'bg-lime text-black font-black'
                        : 'bg-black text-muted hover:text-white',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setRows((prev) => [...prev, blankRow()])}>
              <PlusIcon className="h-3.5 w-3.5" />
              Add condition
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
