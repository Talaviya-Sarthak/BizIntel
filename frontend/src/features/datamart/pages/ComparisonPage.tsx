import { useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Spinner } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Select } from '../../../components/ui/Select';
import { toApiError } from '../../../lib/api';
import { formatNumber, formatDate } from '../../../utils/format';
import { ColumnsIcon, CheckCircleIcon, XCircleIcon } from '../../../components/ui/icons';
import { useDataMartSources } from '../hooks/useDataMartOverview';
import { useComparison } from '../hooks/useComparison';
import { describeDataMartError } from '../utils/datamartErrors';

export function ComparisonPage() {
  const sourcesQuery = useDataMartSources();
  const [datasetA, setDatasetA] = useState('');
  const [datasetB, setDatasetB] = useState('');
  const comparison = useComparison(datasetA || undefined, datasetB || undefined);

  const sources = sourcesQuery.data ?? [];
  const readySources = sources.filter((source) => !datasetA || source.id !== datasetA);

  if (sourcesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
        <Spinner size="md" />
      </div>
    );
  }

  if (sourcesQuery.isError) {
    return (
      <ErrorState message={toApiError(sourcesQuery.error).message} onRetry={() => sourcesQuery.refetch()} />
    );
  }

  const ready = comparison.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Compare datasets"
        description="Pick two datasets to see whether they share compatible columns and how their basic statistics line up."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Dataset A"
          value={datasetA}
          onChange={(event) => setDatasetA(event.target.value)}
          options={[
            { value: '', label: 'Select a dataset', disabled: true },
            ...sources.map((source) => ({ value: source.id, label: source.name })),
          ]}
        />
        <Select
          label="Dataset B"
          value={datasetB}
          onChange={(event) => setDatasetB(event.target.value)}
          options={[
            { value: '', label: 'Select a dataset', disabled: true },
            ...readySources.map((source) => ({ value: source.id, label: source.name })),
          ]}
        />
      </div>

      {comparison.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
          <Spinner size="md" />
        </div>
      ) : comparison.isError ? (
        <ErrorState
          title="Comparison failed"
          message={describeDataMartError(toApiError(comparison.error)).message}
          onRetry={() => comparison.refetch()}
        />
      ) : datasetA && datasetB && ready ? (
        <>
          <div
            className={
              ready.compatible
                ? 'flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-sm text-emerald-300'
                : 'flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-300'
            }
          >
            {ready.compatible ? (
              <CheckCircleIcon className="h-5 w-5 shrink-0" />
            ) : (
              <XCircleIcon className="h-5 w-5 shrink-0" />
            )}
            {ready.compatible
              ? `Datasets share ${ready.sharedColumns.length} compatible column${ready.sharedColumns.length === 1 ? '' : 's'} — they can be joined.`
              : 'These datasets share no compatible key columns, so they cannot be joined directly.'}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ready.datasets.map((dataset, index) => (
              <div key={dataset.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-sm font-semibold text-white">
                  {index === 0 ? 'Dataset A' : 'Dataset B'}
                </h3>
                <p className="mt-0.5 text-sm text-slate-300">{dataset.name}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {formatNumber(dataset.rowCount)} rows · {dataset.columnCount} columns ·{' '}
                  {dataset.fileType} · {formatDate(dataset.createdAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <ColumnsIcon className="h-4 w-4 text-cyan-400" />
                Column compatibility
              </h3>
              {ready.columns.length === 0 ? (
                <EmptyState title="No columns to compare" description="Both datasets appear to have no columns." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-3 py-2 font-medium">Column</th>
                        <th className="px-3 py-2 font-medium">Type A</th>
                        <th className="px-3 py-2 font-medium">Type B</th>
                        <th className="px-3 py-2 font-medium">Compatible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ready.columns.map((column) => (
                        <tr key={column.name} className="border-b border-white/5 last:border-0">
                          <td className="px-3 py-2 text-slate-200">{column.name}</td>
                          <td className="px-3 py-2 text-slate-400">{column.typeA ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-400">{column.typeB ?? '—'}</td>
                          <td className="px-3 py-2">
                            {column.compatible ? (
                              <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <XCircleIcon className="h-4 w-4 text-red-400" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Basic statistics</h3>
              {ready.summary.length === 0 ? (
                <EmptyState title="No statistics available" description="Nothing to compare yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-3 py-2 font-medium">Metric</th>
                        <th className="px-3 py-2 font-medium">Dataset A</th>
                        <th className="px-3 py-2 font-medium">Dataset B</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ready.summary.map((entry) => (
                        <tr key={entry.metric} className="border-b border-white/5 last:border-0">
                          <td className="px-3 py-2 capitalize text-slate-200">{entry.metric}</td>
                          <td className="px-3 py-2 tabular-nums text-slate-300">
                            {entry.datasetA === null ? '—' : entry.datasetA.toLocaleString('en-US')}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-slate-300">
                            {entry.datasetB === null ? '—' : entry.datasetB.toLocaleString('en-US')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <EmptyState
          icon={ColumnsIcon}
          title="Choose two datasets"
          description="The comparison shows how compatible the datasets are and how their sizes line up."
        />
      )}
    </div>
  );
}