import { useMemo, useState } from 'react';
import { Button, Spinner } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { toApiError } from '../../../lib/api';
import { useNavigate } from 'react-router-dom';
import { DataSourceSelector } from '../components/DataSourceSelector';
import { DimensionsSection } from '../components/DimensionsSection';
import { MetricsSection } from '../components/MetricsSection';
import { FiltersSection } from '../components/FiltersSection';
import { JoinsSection } from '../components/JoinsSection';
import { SortsSection } from '../components/SortsSection';
import { QueryResultViewer } from '../components/QueryResultViewer';
import {
  DatabaseZapIcon,
  PlayIcon,
  SparklesIcon,
  AlertIcon,
  CheckCircleIcon,
  ColumnsIcon,
  FilterIcon,
  LayersIcon,
} from '../../../components/ui/icons';
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

type BuilderTab = 'sources' | 'metrics' | 'filters' | 'all';

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
  const [activeTab, setActiveTab] = useState<BuilderTab>('sources');

  const sources = sourcesQuery.data ?? [];
  const selectedSources = sources.filter((source) => state.datasetIds.includes(source.id));

  const issues = useMemo(() => validateQuery(state, sources), [state, sources]);
  const valid = !hasErrors(issues);
  const query = useMemo(() => buildDataMartQuery(state), [state]);
  const errorCount = issues.filter((issue) => issue.level === 'error').length;

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
      <div className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#181818] py-20">
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
    <div className="flex flex-col gap-5 w-full">
      {/* Sleek Studio Control Topbar */}
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">Query Studio</h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Build, validate, and execute no-SQL analytical queries across your datasets.
          </p>
        </div>

        {/* Action Controls & Top Validation Bar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-zinc-900 px-3 py-1.5 text-xs">
            <span className="text-zinc-400 text-[11px] font-mono">Limit:</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={String(state.limit)}
              onChange={(e) => setState((cur) => ({ ...cur, limit: Number(e.target.value) || 1 }))}
              className="w-14 bg-transparent outline-none text-zinc-100 font-mono text-xs"
            />
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 text-[11px] font-mono">Offset:</span>
            <input
              type="number"
              min={0}
              max={100000}
              value={String(state.offset)}
              onChange={(e) => setState((cur) => ({ ...cur, offset: Number(e.target.value) || 0 }))}
              className="w-14 bg-transparent outline-none text-zinc-100 font-mono text-xs"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => void run()}
            disabled={!valid}
            loading={isRunning}
            className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs border border-white/20 px-4 py-2"
          >
            <PlayIcon className="h-3.5 w-3.5" />
            {isRunning ? 'Running…' : 'Run Query'}
          </Button>
        </div>
      </div>

      {/* Validation Banner (Repositioned Inline Banner) */}
      <div className="rounded-xl border border-white/[0.06] bg-[#181818] p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {valid ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircleIcon className="h-4 w-4" />
                Query Validated & Ready to Execute
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <AlertIcon className="h-4 w-4 text-amber-400" />
                Query Validation Status: {errorCount} issue{errorCount === 1 ? '' : 's'} detected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {issues.map((issue, idx) => (
              <span
                key={idx}
                className={
                  issue.level === 'error'
                    ? 'inline-flex items-center rounded-md border border-red-400/20 bg-red-400/10 px-2 py-0.5 text-[10.5px] font-medium text-red-300'
                    : 'inline-flex items-center rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-300'
                }
              >
                {issue.message}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Query Studio Tab Navigation (Reduces Scrolling) */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'sources'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <DatabaseZapIcon className="h-3.5 w-3.5" />
            1. Datasets & Joins
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'metrics'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            2. Dimensions & Metrics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('filters')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'filters'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <FilterIcon className="h-3.5 w-3.5" />
            3. Filters & Sort
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <LayersIcon className="h-3.5 w-3.5" />
            View All
          </button>
        </div>
      </div>

      {/* Query Studio Tab Content Panels */}
      <div className="rounded-xl border border-white/[0.06] bg-[#181818] p-5 shadow-sm min-h-[300px]">
        {(activeTab === 'sources' || activeTab === 'all') && (
          <div className="space-y-6">
            <section className="flex flex-col gap-3 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
                  <DatabaseZapIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">Datasets</h3>
                  <p className="text-[11px] text-zinc-400">Pick one or more READY datasets. The first one is base; joins combine the rest.</p>
                </div>
              </div>
              <DataSourceSelector
                sources={sources}
                selected={state.datasetIds}
                onChange={(datasetIds) => setState((current) => ({ ...current, datasetIds }))}
              />
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
                  <AlertIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">Joins</h3>
                  <p className="text-[11px] text-zinc-400">Combine datasets on matching keys. Only datasets selected above can join.</p>
                </div>
              </div>
              <JoinsSection
                sources={selectedSources}
                joins={state.joins}
                onChange={(joins) => setState((current) => ({ ...current, joins }))}
              />
            </section>
          </div>
        )}

        {(activeTab === 'metrics' || activeTab === 'all') && (
          <div className={`space-y-6 ${activeTab === 'all' ? 'pt-6 border-t border-white/[0.06]' : ''}`}>
            <section className="flex flex-col gap-3 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
                  <SparklesIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">Dimensions (Grouping)</h3>
                  <p className="text-[11px] text-zinc-400">Break rows into groups. Date columns can be grouped by day, week, month, quarter or year.</p>
                </div>
              </div>
              <DimensionsSection
                sources={selectedSources}
                dimensions={state.dimensions}
                onChange={(dimensions) => setState((current) => ({ ...current, dimensions }))}
              />
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
                  <SparklesIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">Metrics (Aggregations & Formulas)</h3>
                  <p className="text-[11px] text-zinc-400">Aggregate column values or build expressions to calculate KPIs.</p>
                </div>
              </div>
              <MetricsSection
                sources={selectedSources}
                metrics={state.metrics}
                onChange={(metrics) => setState((current) => ({ ...current, metrics }))}
              />
            </section>
          </div>
        )}

        {(activeTab === 'filters' || activeTab === 'all') && (
          <div className={`space-y-6 ${activeTab === 'all' ? 'pt-6 border-t border-white/[0.06]' : ''}`}>
            <section className="flex flex-col gap-3 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
                  <AlertIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">Filters</h3>
                  <p className="text-[11px] text-zinc-400">Limit rows before aggregation. Conditions combine with AND/OR groups.</p>
                </div>
              </div>
              <FiltersSection
                sources={selectedSources}
                root={state.filters}
                onChange={(filters) => setState((current) => ({ ...current, filters }))}
              />
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
                  <ColumnsIcon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100">Sort & Ordering</h3>
                  <p className="text-[11px] text-zinc-400">Order results by any dimension or metric in the query.</p>
                </div>
              </div>
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
            </section>
          </div>
        )}
      </div>

      {/* Query Result Section */}
      {error ? (
        <ErrorState title="Query Execution Failed" message={error} onRetry={() => void run()} />
      ) : result ? (
        <QueryResultViewer
          result={result}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
              <p className="text-xs text-zinc-400 font-mono">
                Source Datasets: {result.datasets.map((dataset) => dataset.name).join(' + ')}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setName('');
                  setDescription('');
                  setSaveOpen(true);
                }}
                className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs"
              >
                Save as Analysis
              </Button>
            </div>
          }
        />
      ) : null}

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
            <p className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2 text-xs text-emerald-300">
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