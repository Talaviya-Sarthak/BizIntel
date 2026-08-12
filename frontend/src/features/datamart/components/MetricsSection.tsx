import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { TrashIcon, PlusIcon, HashIcon } from '../../../components/ui/icons';
import type { DataMartAggregation, MetricFormat, QueryDatasetSource } from '../types';
import { DATAMART_AGGREGATIONS, METRIC_FORMATS } from '../types';
import { collectColumns, isNumericColumn, type MetricRow } from '../utils/queryBuilder';

interface MetricsSectionProps {
  sources: QueryDatasetSource[];
  metrics: MetricRow[];
  onChange: (next: MetricRow[]) => void;
}

const AGGREGATION_LABELS: Record<DataMartAggregation, string> = {
  count: 'Count',
  count_distinct: 'Distinct count',
  sum: 'Sum',
  avg: 'Average',
  min: 'Minimum',
  max: 'Maximum',
  median: 'Median',
  stddev: 'Std dev',
  variance: 'Variance',
};

export function MetricsSection({ sources, metrics, onChange }: MetricsSectionProps) {
  const columns = collectColumns(sources);
  const numericColumns = columns.filter((column) => isNumericColumn(column.category));

  function add() {
    onChange([
      ...metrics,
      {
        id: `metric-${Date.now()}`,
        column: '',
        aggregation: undefined,
        formula: undefined,
        alias: '',
      },
    ]);
  }

  function update(id: string, patch: Partial<MetricRow>) {
    onChange(metrics.map((metric) => (metric.id === id ? { ...metric, ...patch } : metric)));
  }

  function remove(id: string) {
    onChange(metrics.filter((metric) => metric.id !== id));
  }

  // Formula quick-insert helpers use the safe grammar; the string is only
  // assembled here, never evaluated.
  function insertAggregation(id: string, aggregation: DataMartAggregation) {
    const metric = metrics.find((entry) => entry.id === id);
    if (!metric) return;
    const column = metric.column;
    const fragment = column ? `${aggregation}(${column})` : `${aggregation}(*)`;
    const current = metric.formula ? metric.formula.trim() : '';
    const merged = current === '' ? fragment : `${current} + ${fragment}`;
    update(id, { formula: merged });
  }

  function suggestAlias(metric: MetricRow): string {
    if (metric.alias) return metric.alias;
    if (metric.column && metric.aggregation) {
      return `${metric.aggregation}_${metric.column}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    }
    return 'metric';
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {metrics.map((metric) => (
          <div key={metric.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1 sm:flex sm:gap-2">
                <div className="flex-1">
                  <Select
                    label="Measure"
                    value={metric.column ?? ''}
                    onChange={(event) => update(metric.id, { column: event.target.value || undefined })}
                    options={[
                      { value: '', label: 'Select a numeric column', disabled: true },
                      ...numericColumns.map((column) => ({
                        value: column.name,
                        label: column.name + (column.datasetIds.length > 1 ? ' (ambiguous)' : ''),
                      })),
                    ]}
                  />
                </div>
                <div className="sm:w-48">
                  <Select
                    label="Aggregation"
                    value={metric.aggregation ?? ''}
                    onChange={(event) =>
                      update(metric.id, {
                        aggregation: (event.target.value || undefined) as DataMartAggregation | undefined,
                      })
                    }
                    options={[
                      { value: '', label: 'Select', disabled: true },
                      ...DATAMART_AGGREGATIONS.map((aggregation) => ({
                        value: aggregation,
                        label: AGGREGATION_LABELS[aggregation],
                      })),
                    ]}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove metric"
                onClick={() => remove(metric.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <FormulaBuilder
                  metric={metric}
                  onInsertAggregation={(aggregation) => insertAggregation(metric.id, aggregation)}
                  onFormulaChange={(formula) => update(metric.id, { formula: formula || undefined })}
                />
              </div>
              <div className="sm:w-56">
                <Input
                  id={`alias-${metric.id}`}
                  label="Output name (alias)"
                  placeholder={suggestAlias(metric)}
                  value={metric.alias}
                  onChange={(event) => update(metric.id, { alias: event.target.value })}
                />
              </div>
            </div>

            {metric.column ? (
              <p className="text-[11px] text-slate-500">
                Output: <span className="font-mono text-slate-400">
                  {metric.aggregation ? `${metric.aggregation.toUpperCase()}(${metric.column})` : metric.formula || '—'}
                </span>
                {metric.alias ? ` → ${metric.alias}` : ''}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={add}>
          <PlusIcon className="h-4 w-4" />
          Add metric
        </Button>
        <span className="text-xs text-slate-500">
          <HashIcon className="mr-1 inline h-3.5 w-3.5" />
          Metrics summarize rows; add one or more to aggregate.
        </span>
      </div>
    </div>
  );
}

interface FormulaBuilderProps {
  metric: MetricRow;
  onFormulaChange: (formula: string) => void;
  onInsertAggregation: (aggregation: DataMartAggregation) => void;
}

function SigmaIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props} aria-hidden="true">
      <path d="M18 7V4H6l6 8-6 8h12v-3" />
    </svg>
  );
}

/**
 * Structured formula editor for a calculated metric. Builds expressions from
 * whitelisted aggregations over the selected column — user text is inserted
 * into the value field verbatim, and only the aggregate fragments are
 * generated for the formula. The full expression is validated server-side by
 * the compiler; this builder never evaluates JavaScript.
 */
export function FormulaBuilder({ metric, onFormulaChange, onInsertAggregation }: FormulaBuilderProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-300">Formula (optional)</label>
      <Input
        id={`formula-${metric.id}`}
        placeholder="e.g. sum(revenue) / count(*) — aggregate over a column or use an expression"
        value={metric.formula ?? ''}
        onChange={(event) => onFormulaChange(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
        <SigmaIcon className="h-3.5 w-3.5 text-cyan-400" />
        <span className="mr-1">Insert an aggregation:</span>
        {(['sum', 'avg', 'count', 'count_distinct', 'median'] as DataMartAggregation[]).map((aggregation) => (
          <button
            key={aggregation}
            type="button"
            onClick={() => onInsertAggregation(aggregation)}
            className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-300"
          >
            {aggregation}
          </button>
        ))}
      </div>
    </div>
  );
}

// Re-export METRIC_FORMATS typing note so format selectors can share labels.
export const METRIC_FORMAT_OPTIONS: { value: MetricFormat; label: string }[] =
  METRIC_FORMATS.map((format) => ({ value: format, label: format }));