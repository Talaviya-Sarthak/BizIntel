import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
  TrashIcon,
  PlusIcon,
  FilterIcon,
  CloseIcon,
} from '../../../components/ui/icons';
import type {
  FilterCondition,
  FilterNode,
  FilterOperator,
  QueryColumn,
  QueryDatasetSource,
} from '../types';
import { collectColumns } from '../utils/queryBuilder';

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: 'equals',
  neq: 'does not equal',
  gt: 'greater than',
  gte: 'greater or equal',
  lt: 'less than',
  lte: 'less or equal',
  contains: 'contains',
  not_contains: 'does not contain',
  in: 'is in',
  not_in: 'is not in',
  is_null: 'is null',
  is_not_null: 'is not null',
  between: 'between',
};

const OPERATORS_ALL: FilterOperator[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'not_contains',
  'in',
  'not_in',
  'is_null',
  'is_not_null',
  'between',
];

const OPERATORS_WITH_VALUE: FilterOperator[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'not_contains',
];

const OPERATORS_WITH_SECOND_VALUE: FilterOperator[] = ['between', 'in', 'not_in'];

interface FiltersSectionProps {
  sources: QueryDatasetSource[];
  root: FilterNode | null;
  onChange: (next: FilterNode | null) => void;
}

/**
 * Builds a recursive filter tree (AND/OR groups of conditions) matching the
 * backend's FilterNode schema. Column references are validated against the
 * selected datasets' schemas and flagged when ambiguous.
 */
export function FiltersSection({ sources, root, onChange }: FiltersSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      {root ? (
        <FilterNodeEditor
          node={root}
          onReplace={onChange}
          onClear={() => onChange(null)}
          sources={sources}
          showRemove
        />
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-slate-500">
            No filters — the query runs over every row in the combined datasets.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                conjunction: 'AND',
                nodes: [
                  { column: '', operator: 'eq', value: '' as unknown },
                ],
              })
            }
          >
            <PlusIcon className="h-4 w-4" />
            Add filter
          </Button>
        </div>
      )}
    </div>
  );
}

interface FilterNodeEditorProps {
  node: FilterNode;
  onReplace: (next: FilterNode) => void;
  onClear?: () => void;
  sources: QueryDatasetSource[];
  showRemove?: boolean;
}

function FilterNodeEditor({ node, onReplace, onClear, sources, showRemove = false }: FilterNodeEditorProps) {
  const columns = collectColumns(sources);

  if ('conjunction' in node) {
    const conjoined = node;
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.03] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onReplace({
                conjunction: conjoined.conjunction === 'AND' ? 'OR' : 'AND',
                nodes: conjoined.nodes,
              })
            }
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400/40"
          >
            <FilterIcon className="h-3.5 w-3.5" />
            {conjoined.conjunction}
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onReplace({
                conjunction: conjoined.conjunction,
                nodes: [...conjoined.nodes, { column: '', operator: 'eq', value: '' as unknown }],
              })
            }
          >
            <PlusIcon className="h-4 w-4" />
            Condition
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onReplace({
                conjunction: conjoined.conjunction,
                nodes: [...conjoined.nodes, { conjunction: 'OR', nodes: [] as FilterNode[] }],
              })
            }
          >
            <PlusIcon className="h-4 w-4" />
            Group
          </Button>
          {showRemove ? (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-slate-400"
              onClick={onClear}
            >
              <CloseIcon className="h-4 w-4" />
              Clear
            </Button>
          ) : null}
        </div>

        {conjoined.nodes.length === 0 ? (
          <p className="text-xs text-slate-500">Empty group — add a condition.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {conjoined.nodes.map((child, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <FilterNodeEditor
                    node={child}
                    onReplace={(next) => {
                      const nodes = [...conjoined.nodes];
                      nodes[index] = next;
                      onReplace({ ...conjoined, nodes });
                    }}
                    sources={sources}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove condition"
                  className="mt-1 text-slate-500 hover:text-red-300"
                  onClick={() => {
                    const nodes = conjoined.nodes.filter((_, i) => i !== index);
                    onReplace({ ...conjoined, nodes });
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <ConditionEditor
      condition={node}
      onReplace={onReplace}
      columns={columns}
    />
  );
}

interface ConditionEditorProps {
  condition: FilterCondition;
  onReplace: (next: FilterNode) => void;
  columns: QueryColumn[];
}

function ConditionEditor({ condition, onReplace, columns }: ConditionEditorProps) {
  const selectedColumn = columns.find((column) => column.name === condition.column);
  const operator = condition.operator;
  const isNumeric = !!selectedColumn && ['integer', 'float', 'decimal'].includes(selectedColumn.category);

  function update(patch: Partial<FilterCondition>) {
    onReplace({ ...condition, ...patch });
  }

  return (
    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
      <Select
        label="Column"
        value={condition.column}
        onChange={(event) =>
          update({ column: event.target.value, value: undefined, value2: undefined })
        }
        options={[
          { value: '', label: 'Select a column', disabled: true },
          ...columns.map((column) => ({
            value: column.name,
            label: column.name + (column.datasetIds.length > 1 ? ' (ambiguous)' : ''),
          })),
        ]}
      />
      <Select
        label="Operator"
        value={operator}
        onChange={(event) => update({ operator: event.target.value as FilterOperator })}
        options={OPERATORS_ALL.map((entry) => ({ value: entry, label: OPERATOR_LABELS[entry] }))}
      />
      {OPERATORS_WITH_SECOND_VALUE.includes(operator) ? (
        <div className="grid grid-cols-2 gap-2">
          <Input
            label={operator === 'between' ? 'From' : 'Values (comma separated)'}
            className={operator === 'between' ? undefined : 'col-span-2'}
            value={String(condition.value ?? '')}
            onChange={(event) => update({ value: coerceValue(event.target.value, isNumeric) })}
          />
          {operator === 'between' ? (
            <Input
              label="To"
              value={String(condition.value2 ?? '')}
              onChange={(event) => update({ value2: coerceValue(event.target.value, isNumeric) })}
            />
          ) : null}
        </div>
      ) : OPERATORS_WITH_VALUE.includes(operator) ? (
        <Input
          label="Value"
          placeholder={isNumeric ? 'e.g. 1000' : 'value'}
          value={String(condition.value ?? '')}
          onChange={(event) => update({ value: coerceValue(event.target.value, isNumeric) })}
        />
      ) : (
        <p className="flex items-end pb-2 text-xs text-slate-500">No value needed.</p>
      )}
    </div>
  );
}

/**
 * Light client-side coercion so numeric operations send numbers and CSV inputs
 * become arrays. Full type checking remains the compiler's job at run time.
 */
function coerceValue(raw: string, isNumeric: boolean): unknown {
  if (raw.trim() === '') return '' as unknown;
  if (raw.includes(',')) {
    return raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (isNumeric ? Number(part) : part));
  }
  if (isNumeric) {
    const value = Number(raw);
    return Number.isFinite(value) ? value : raw;
  }
  return raw;
}