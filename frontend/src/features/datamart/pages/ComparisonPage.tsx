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
      <div className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#181818] py-20">
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
        title="Compare Datasets"
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
        <div className="flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#181818] py-20">
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
                ? 'flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-xs text-emerald-300'
                : 'flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-xs text-amber-300'
            }
          >
            {ready.compatible ? (
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
            ) : (
              <XCircleIcon className="h-4 w-4 shrink-0" />
            )}
            {ready.compatible
              ? `Datasets share ${ready.sharedColumns.length} compatible column${ready.sharedColumns.length === 1 ? '' : 's'} — they can be joined.`
              : 'These datasets share no compatible key columns, so they cannot be joined directly.'}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ready.datasets.map((dataset, index) => (
              <div key={dataset.id} className="rounded-xl border border-white/[0.06] bg-[#181818] p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-zinc-100">
                  {index === 0 ? 'Dataset A' : 'Dataset B'}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-300 font-semibold">{dataset.name}</p>
                <p className="mt-2 text-[11px] text-zinc-400 font-mono">
                  {formatNumber(dataset.rowCount)} rows · {dataset.columnCount} columns ·{' '}
                  {dataset.fileType} · {formatDate(dataset.createdAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-white/[0.06] bg-[#181818] p-4 sm:p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-zinc-100 border-b border-white/[0.06] pb-2">
                <ColumnsIcon className="h-3.5 w-3.5 text-zinc-300" />
                Column Compatibility
              </h3>
              {ready.columns.length === 0 ? (
                <EmptyState title="No columns to compare" description="Both datasets appear to have no columns." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold bg-zinc-900/60">
                        <th className="px-3 py-2 font-semibold">Column</th>
                        <th className="px-3 py-2 font-semibold">Type A</th>
                        <th className="px-3 py-2 font-semibold">Type B</th>
                        <th className="px-3 py-2 font-semibold">Compatible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ready.columns.map((column) => (
                        <tr key={column.name} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-3 py-2 text-zinc-200 font-semibold">{column.name}</td>
                          <td className="px-3 py-2 text-zinc-400 font-mono">{column.typeA ?? '—'}</td>
                          <td className="px-3 py-2 text-zinc-400 font-mono">{column.typeB ?? '—'}</td>
                          <td className="px-3 py-2">
                            {column.compatible ? (
                              <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <XCircleIcon className="h-3.5 w-3.5 text-red-400" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-white/[0.06] bg-[#181818] p-4 sm:p-5 shadow-sm">
              <h3 className="mb-3 text-xs font-semibold text-zinc-100 border-b border-white/[0.06] pb-2">Basic Statistics Comparison</h3>
              {ready.summary.length === 0 ? (
                <EmptyState title="No statistics available" description="Nothing to compare yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold bg-zinc-900/60">
                        <th className="px-3 py-2 font-semibold">Metric</th>
                        <th className="px-3 py-2 font-semibold">Dataset A</th>
                        <th className="px-3 py-2 font-semibold">Dataset B</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ready.summary.map((entry) => (
                        <tr key={entry.metric} className="border-b border-white/[0.04] last:border-0">
                          <td className="px-3 py-2 capitalize text-zinc-200 font-semibold">{entry.metric}</td>
                          <td className="px-3 py-2 tabular-nums text-zinc-300 font-mono">
                            {entry.datasetA === null ? '—' : entry.datasetA.toLocaleString('en-US')}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-zinc-300 font-mono">
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
          title="Choose two datasets to compare"
          description="The comparison engine checks schema compatibility, shared keys, and row counts."
        />
      )}
    </div>
  );
}