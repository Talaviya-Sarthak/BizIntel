import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { toApiError } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import { BuilderSection } from '../components/BuilderSection';
import { DataSourceSelector } from '../components/DataSourceSelector';
import { DimensionsSection } from '../components/DimensionsSection';
import { MetricsSection } from '../components/MetricsSection';
import { FiltersSection } from '../components/FiltersSection';
import { JoinsSection } from '../components/JoinsSection';
import { SortsSection } from '../components/SortsSection';
import { QueryResultViewer } from '../components/QueryResultViewer';
import { DatabaseZapIcon, PlayIcon, SparklesIcon, AlertIcon, CheckCircleIcon } from '../../../components/ui/icons';
import { useDataMartSources } from '../hooks/useDataMartOverview';
import { describeDataMartError } from '../utils/datamartErrors';
import {
  buildDataMartQuery,
  collectColumns,
  createEmptyQueryState,
  hasErrors,
  validateQuery,
  type QueryBuilderState,
} from '../utils/queryBuilder';
import { useCreateAnalysis } from '../hooks/useAnalyses';
import { datamartApi } from '../services/datamartApi';
import type { DataMartAnalysis, DataMartQueryResult } from '../types';

export function QueryBuilderPage() {
  const navigate = useNavigate();
  const sourcesQuery = useDataMartSources();
  const createAnalysis = useCreateAnalysis();

  const [state, setState] = useState<QueryBuilderState>(createEmptyQueryState);
  const [result, setResult] = useState<DataMartQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const sources = sourcesQuery.data ?? [];
  const selectedSources = sources.filter((source) => state.datasetIds.includes(source.id));

  const issues = useMemo(() => validateQuery(state, sources), [state, sources]);
  const valid = !hasErrors(issues);
  const query = useMemo(() => buildDataMartQuery(state), [state]);

  const metricAliases = state.metrics
    .filter((metric) => metric.alias)
    .map((metric) => ({ value: metric.alias, label: metric.alias }));

  async function run() {
    if (!valid) return;
    setError(null);
    setIsRunning(true);
    try {
      const next = await datamartApi.executeQuery(query);
      setResult(next);
    } catch (runError) {
      setResult(null);
      setError(describeDataMartError(toApiError(runError)).message);
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSave() {
    if (!valid || !name.trim()) return;
    try {
      const saved: DataMartAnalysis = await createAnalysis.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        query,
        tags: [],
      });
      setSavedId(saved.id);
    } catch (saveError) {
      setError(toApiError(saveError).message);
    }
  }

  if (sourcesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (sourcesQuery.isError) {
    return (
      <ErrorState
        message={toApiError(sourcesQuery.error).message}
        onRetry={() => sourcesQuery.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Query builder"
        description="Combine datasets into reusable analyses—no SQL required. Everything you build is validated against your dataset schemas before it runs."
        actions={
          <Button variant="primary" onClick={() => void run()} disabled={!valid} loading={isRunning}>
            <PlayIcon className="h-4 w-4" />
            {isRunning ? 'Running…' : 'Run query'}
          </Button>
        }
      />

      {error ? (
        <ErrorState title="Query failed" message={error} onRetry={() => void run()} />
      ) : result ? (
        <QueryResultViewer
          result={result}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {result.datasets.map((dataset) => dataset.name).join(' + ')}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setName('');
                  setDescription('');
                  setSaveOpen(true);
                }}
              >
                Save as analysis
              </Button>
            </div>
          }
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <BuilderSection
            title="Datasets"
            icon={DatabaseZapIcon}
            description="Pick one or more READY datasets. The first one is the base; joins combine the rest."
          >
            <DataSourceSelector
              sources={sources}
              selected={state.datasetIds}
              onChange={(datasetIds) => setState((current) => ({ ...current, datasetIds }))}
            />
          </BuilderSection>

          <BuilderSection
            title="Dimensions"
            icon={SparklesIcon}
            description="Break rows into groups. Date columns can be grouped by day, week, month, quarter or year."
          >
            <DimensionsSection
              sources={selectedSources}
              dimensions={state.dimensions}
              onChange={(dimensions) => setState((current) => ({ ...current, dimensions }))}
            />
          </BuilderSection>

          <BuilderSection
            title="Metrics"
            icon={SparklesIcon}
            description="Aggregate the data. Pick a column + aggregation, or insert one into a formula."
          >
            <MetricsSection
              sources={selectedSources}
              metrics={state.metrics}
              onChange={(metrics) => setState((current) => ({ ...current, metrics }))}
            />
          </BuilderSection>

          <BuilderSection
            title="Filters"
            icon={AlertIcon}
            description="Limit rows before aggregation. Conditions combine with AND/OR groups."
          >
            <FiltersSection
              sources={selectedSources}
              root={state.filters}
              onChange={(filters) => setState((current) => ({ ...current, filters }))}
            />
          </BuilderSection>

          <BuilderSection
            title="Joins"
            icon={AlertIcon}
            description="Combine datasets on matching keys. Only datasets selected above can join."
          >
            <JoinsSection
              sources={selectedSources}
              joins={state.joins}
              onChange={(joins) => setState((current) => ({ ...current, joins }))}
            />
          </BuilderSection>

          <BuilderSection
            title="Sort"
            icon={AlertIcon}
            description="Order results by any dimension or metric in the query.">
            <SortsSection
              columns={[
                ...collectColumns(selectedSources)
                  .filter((column) => state.dimensions.some((dimension) => dimension.column === column.name))
                  .map((column) => ({ value: column.name, label: column.name })),
                ...metricAliases,
              ]}
              sorts={state.sorts}
              onChange={(sorts) => setState((current) => ({ ...current, sorts }))}
            />
          </BuilderSection>
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          <BuilderSection title="Validation" icon={CheckCircleIcon}>
            {issues.length === 0 ? (
              <p className="text-sm text-emerald-300">Ready to run.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {issues.map((issue, index) => (
                  <li
                    key={index}
                    className={
                      issue.level === 'error'
                        ? 'rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-xs text-red-300'
                        : 'rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-xs text-amber-300'
                    }
                  >
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <span className="text-xs text-slate-500">
                {issues.filter((issue) => issue.level === 'error').length} error
                {issues.filter((issue) => issue.level === 'error').length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-2">
                <Input
                  id="builder-limit"
                  label="Limit"
                  type="number"
                  min={1}
                  max={10000}
                  className="w-24 text-xs"
                  value={String(state.limit)}
                  onChange={(event) =>
                    setState((current) => ({ ...current, limit: Number(event.target.value) || 1 }))
                  }
                />
                <Input
                  id="builder-offset"
                  label="Offset"
                  type="number"
                  min={0}
                  max={100000}
                  className="w-24 text-xs"
                  value={String(state.offset)}
                  onChange={(event) =>
                    setState((current) => ({ ...current, offset: Number(event.target.value) || 0 }))
                  }
                />
              </div>
            </div>
          </BuilderSection>
        </div>
      </div>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save analysis"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!name.trim()}
              loading={createAnalysis.isPending}
              onClick={() => void handleSave()}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            id="analysis-name"
            label="Name"
            placeholder="e.g. Revenue by category"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            id="analysis-description"
            label="Description (optional)"
            placeholder="What does this analysis answer?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {savedId ? (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2 text-sm text-emerald-300">
              <CheckCircleIcon className="h-4 w-4" />
              Saved! <Button variant="link" size="sm" onClick={() => navigate(`/datamart/analyses/${savedId}`)}>Open it</Button>
              <Button variant="link" size="sm" onClick={() => navigate('/datamart/analyses')}>View all</Button>
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}