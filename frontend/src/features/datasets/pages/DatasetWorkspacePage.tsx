import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Spinner } from '../../../components/ui/Button';
import { XCircleIcon } from '../../../components/ui/icons';
import { toApiError } from '../../../lib/api';
import { DeleteDatasetDialog } from '../components/DeleteDatasetDialog';
import { useDataset, useDeleteDataset } from '../hooks/useDatasets';
import { useDownloadDataset, useDatasetAnalyticsColumns } from '../hooks/useDatasetAnalytics';
import { DatasetHeader } from '../components/workspace/DatasetHeader';
import { DatasetTabs, type DatasetTabKey } from '../components/workspace/DatasetTabs';
import { OverviewSection } from '../components/workspace/OverviewSection';
import { ColumnTable } from '../components/workspace/ColumnTable';
import { ColumnDetailPanel } from '../components/workspace/ColumnDetailPanel';
import { DataExplorerSection } from '../components/workspace/DataExplorerSection';
import { SuggestedCharts } from '../components/workspace/SuggestedCharts';
import { ChartBuilder } from '../components/workspace/ChartBuilder';
import { InsightsSection } from '../components/workspace/InsightsSection';
import { DataQualitySection } from '../components/workspace/DataQualitySection';
import type { AnalyticsColumn } from '../analytics/types';

/** Dataset Intelligence Workspace: overview, columns, explore, charts, insights, quality. */
export function DatasetWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const datasetQuery = useDataset(id);
  const columnsQuery = useDatasetAnalyticsColumns(id);
  const deleteMutation = useDeleteDataset();
  const downloadMutation = useDownloadDataset();

  const [tab, setTab] = useState<DatasetTabKey>('overview');
  const [selectedColumn, setSelectedColumn] = useState<AnalyticsColumn | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const columns = columnsQuery.data?.columns ?? [];

  async function handleDelete() {
    if (!id) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/datasets');
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  function handleRefresh() {
    if (id) {
      void queryClient.invalidateQueries({ queryKey: ['dataset', id, 'analytics'] });
    }
  }

  function handleDownload() {
    if (!id || !datasetQuery.data) return;
    downloadMutation.mutate({
      id,
      fallbackName: datasetQuery.data.dataset.originalFilename,
    });
  }

  if (datasetQuery.isLoading) {
    return (
      <div className="flex items-center justify-center border-2 border-white bg-ink-card py-24 rounded-md shadow-brutal-sm">
        <Spinner size="md" />
      </div>
    );
  }

  if (datasetQuery.isError || !datasetQuery.data) {
    return (
      <ErrorState
        message={toApiError(datasetQuery.error).message}
        onRetry={() => datasetQuery.refetch()}
      />
    );
  }

  const dataset = datasetQuery.data.dataset;
  const isReady = dataset.status === 'READY';
  const isFailed = dataset.status === 'FAILED';

  return (
    <div className="flex flex-col gap-6 bg-black">
      <DatasetHeader
        dataset={dataset}
        columnsCount={columnsQuery.data?.total ?? dataset.columnCount ?? undefined}
        refreshing={false}
        onRefresh={handleRefresh}
        downloading={downloadMutation.isPending}
        onDownload={handleDownload}
        onDelete={() => {
          setDeleteError(null);
          setShowDelete(true);
        }}
      />

      {isFailed && dataset.errorMessage ? (
        <div className="flex items-start gap-3 border-2 border-pink bg-pink/5 p-5 rounded-md">
          <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-pink" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-pink">Dataset could not be processed.</p>
            <p className="mt-1.5 text-xs leading-relaxed text-pink font-semibold uppercase tracking-wider">{dataset.errorMessage}</p>
          </div>
        </div>
      ) : null}

      {isReady ? (
        <>
          <DatasetTabs active={tab} onChange={setTab} />

          <main className="flex flex-col gap-6 bg-black">
            {tab === 'overview' ? <OverviewSection datasetId={dataset.id} /> : null}

            {tab === 'columns' ? (
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start bg-black">
                <div className="min-w-0 flex-1">
                  {columnsQuery.isLoading ? <Spinner size="md" /> : null}
                  {columnsQuery.isError ? (
                    <ErrorState
                      message={toApiError(columnsQuery.error).message}
                      onRetry={() => columnsQuery.refetch()}
                    />
                  ) : null}
                  {columnsQuery.data ? (
                    <ColumnTable
                      columns={columnsQuery.data.columns}
                      selectedColumn={selectedColumn?.name}
                      onSelect={setSelectedColumn}
                    />
                  ) : null}
                </div>
                <div className="w-full min-w-0 xl:w-[46rem]">
                  {selectedColumn ? (
                    <ColumnDetailPanel
                      datasetId={dataset.id}
                      column={selectedColumn}
                      onClose={() => setSelectedColumn(null)}
                    />
                  ) : (
                    <div className="border-2 border-dashed border-white bg-ink-card px-6 py-16 text-center text-xs font-bold uppercase tracking-wider text-muted rounded-md shadow-brutal-sm">
                      Select a column to inspect its statistics, distribution and outliers.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {tab === 'explore' ? <DataExplorerSection datasetId={dataset.id} columns={columns} /> : null}

            {tab === 'charts' ? (
              <>
                <SuggestedCharts datasetId={dataset.id} columns={columns} />
                <ChartBuilder datasetId={dataset.id} columns={columns} />
              </>
            ) : null}

            {tab === 'insights' ? <InsightsSection datasetId={dataset.id} /> : null}

            {tab === 'quality' ? <DataQualitySection datasetId={dataset.id} /> : null}
          </main>
        </>
      ) : (
        <div className="border-2 border-white bg-ink-card p-8 text-center rounded-md shadow-brutal-sm">
          {isFailed ? (
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              The dataset workspace is unavailable because the dataset failed to process.
            </p>
          ) : (
            <p className="flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-wider text-muted">
              <Spinner size="sm" />
              This dataset is still being processed. Refresh shortly.
            </p>
          )}
        </div>
      )}

      {deleteError ? (
        <p className="flex items-center gap-2 border-2 border-pink bg-pink/5 px-4 py-3 text-xs font-bold uppercase tracking-wider text-pink rounded-md">
          <XCircleIcon className="h-4.5 w-4.5 shrink-0 text-pink" />
          {deleteError}
        </p>
      ) : null}

      <DeleteDatasetDialog
        open={showDelete}
        dataset={dataset}
        deleting={deleteMutation.isPending}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
