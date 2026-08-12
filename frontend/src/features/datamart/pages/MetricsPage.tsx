import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button, Spinner } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/checkbox';
import { toApiError } from '../../../lib/api';
import { PlusIcon, DatabaseZapIcon, TrashIcon } from '../../../components/ui/icons';
import { useDataMartSources } from '../hooks/useDataMartOverview';
import {
  useCreateMetric,
  useDeleteMetric,
  useExecuteMetric,
  useMetrics,
} from '../hooks/useMetrics';
import { describeDataMartError } from '../utils/datamartErrors';
import { formatMetricValue, METRIC_FORMAT_LABELS } from '../utils/formatting';
import { describeMetricDefinition } from '../utils/formatting';
import { isNumericCategory } from '../utils/category';
import type { DataMartAggregation, MetricDefinition, MetricFormat } from '../types';
import { DATAMART_AGGREGATIONS, METRIC_FORMATS } from '../types';

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

export function MetricsPage() {
  const metricsQuery = useMetrics();
  const sourcesQuery = useDataMartSources();
  const createMutation = useCreateMetric();
  const deleteMutation = useDeleteMetric();
  const executeMutation = useExecuteMetric();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [column, setColumn] = useState('');
  const [aggregation, setAggregation] = useState<DataMartAggregation>('sum');
  const [format, setFormat] = useState<MetricFormat>('number');
  const [makeFormula, setMakeFormula] = useState(false);
  const [formula, setFormula] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [executables, setExecutables] = useState<Map<string, string>>(new Map());

  const sources = sourcesQuery.data ?? [];
  const selectedSource = sources.find((source) => source.id === datasetId);
  const numericColumns = useMemo(
    () => (selectedSource?.columns ?? []).filter((columnEntry) => isNumericCategory(columnEntry.category)),
    [selectedSource],
  );

  async function handleCreate() {
    const definition: MetricDefinition = makeFormula
      ? { kind: 'formula', formula }
      : { kind: 'aggregate', column, aggregation };
    try {
      const metric = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        datasetId,
        definition,
        format,
      });
      executeMutation
        .mutateAsync(metric.id)
        .then((result) => {
          const value = result.result.rows[0];
          if (value) {
            const keys = Object.keys(value);
            const key = keys[0] ?? metric.name;
            setExecutables((current) => new Map(current).set(metric.id, String(value[key])));
          }
        })
        .catch(() => undefined);
      setCreateOpen(false);
      setName('');
      setDescription('');
      setDatasetId('');
      setColumn('');
      setFormula('');
      setMakeFormula(false);
    } catch {
      // surfaced via createMutation.errorMessage
    }
  }

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  async function handleExecute(id: string) {
    try {
      const result = await executeMutation.mutateAsync(id);
      const value = result.result.rows[0];
      if (value) {
        const key = Object.keys(value)[0] ?? result.metric.name;
        setExecutables((current) => new Map(current).set(id, String(value[key])));
      }
    } catch {
      // surfaced via executeMutation.errorMessage
    }
  }

  if (metricsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#181818] py-20">
        <Spinner size="md" />
      </div>
    );
  }

  if (metricsQuery.isError) {
    return (
      <ErrorState message={toApiError(metricsQuery.error).message} onRetry={() => metricsQuery.refetch()} />
    );
  }

  const metrics = metricsQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Metrics Catalog"
        description="Promote your most-used aggregations to reusable KPIs. Each metric can be executed against its dataset and dropped onto a dashboard."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)} className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs border border-white/20">
            <PlusIcon className="h-3.5 w-3.5" />
            New metric
          </Button>
        }
      />

      {metrics.length === 0 ? (
        <EmptyState
          icon={DatabaseZapIcon}
          title="No metrics created yet"
          description="Create a metric from a column aggregation or a formula to start reusing it."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const executed = executables.get(metric.id);
            return (
              <article
                key={metric.id}
                className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-[#181818] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-semibold text-zinc-100">{metric.name}</h3>
                    {metric.description ? (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-400">{metric.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${metric.name}`}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-400/10 hover:text-red-400"
                    onClick={() => void handleDelete(metric.id)}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="truncate font-mono text-[11px] text-zinc-200">
                  {describeMetricDefinition(metric.definition)}
                </p>
                <p className="text-[11px] text-zinc-400">{metric.datasetName ?? '—'}</p>
                <p className="my-2 text-2xl font-bold tabular-nums text-zinc-100 font-mono">
                  {executed !== undefined ? formatMetricValue(executed, metric.format) : '—'}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] pt-2.5">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                    {METRIC_FORMAT_LABELS[metric.format]}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={executeMutation.isPending}
                    onClick={() => void handleExecute(metric.id)}
                    className="border-white/[0.08] bg-zinc-900 text-zinc-200"
                  >
                    <DatabaseZapIcon className="h-3.5 w-3.5" />
                    Execute
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {createMutation.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
          {describeDataMartError(toApiError(createMutation.error)).message}
        </p>
      ) : null}

      {deleteError ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
          {deleteError}
        </p>
      ) : null}

      {executeMutation.error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-xs text-red-300">
          {describeDataMartError(toApiError(executeMutation.error)).message}
        </p>
      ) : null}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New metric"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              disabled={
                !name.trim() ||
                !datasetId ||
                (makeFormula ? !formula.trim() : !column)
              }
              onClick={() => void handleCreate()}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            id="metric-name"
            label="Name"
            placeholder="e.g. Total revenue"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            id="metric-description"
            label="Description (optional)"
            placeholder="What does this KPI measure?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <Select
            label="Dataset"
            value={datasetId}
            onChange={(event) => {
              setDatasetId(event.target.value);
              setColumn('');
            }}
            options={[
              { value: '', label: 'Select a dataset', disabled: true },
              ...sources.map((source) => ({ value: source.id, label: source.name })),
            ]}
          />

          <label className="flex items-center gap-2 text-xs font-medium text-zinc-300">
            <Checkbox
              checked={makeFormula}
              onCheckedChange={(checked) => {
                setMakeFormula(checked);
                if (checked) setFormula('sum(total)');
              }}
            />
            Build a formula instead of a simple aggregation
          </label>

          {makeFormula ? (
            <Input
              id="metric-formula"
              label="Formula"
              placeholder="e.g. sum(revenue) / count(*) or avg(price)"
              value={formula}
              onChange={(event) => setFormula(event.target.value)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Column"
                value={column}
                onChange={(event) => setColumn(event.target.value)}
                options={[
                  { value: '', label: 'Select a column', disabled: true },
                  ...numericColumns.map((columnEntry) => ({
                    value: columnEntry.name,
                    label: columnEntry.name,
                  })),
                ]}
              />
              <Select
                label="Aggregation"
                value={aggregation}
                onChange={(event) =>
                  setAggregation(event.target.value as DataMartAggregation)
                }
                options={DATAMART_AGGREGATIONS.map((entry) => ({
                  value: entry,
                  label: AGGREGATION_LABELS[entry],
                }))}
              />
            </div>
          )}

          <Select
            label="Format"
            value={format}
            onChange={(event) => setFormat(event.target.value as MetricFormat)}
            options={METRIC_FORMATS.map((entry) => ({
              value: entry,
              label: METRIC_FORMAT_LABELS[entry],
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}