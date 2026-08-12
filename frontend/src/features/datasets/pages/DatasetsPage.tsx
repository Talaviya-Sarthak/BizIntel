import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FolderIcon, PlusIcon, UploadIcon } from '../../../components/ui/icons';
import { toApiError } from '../../../lib/api';
import { DatasetTable } from '../components/DatasetTable';
import { DeleteDatasetDialog } from '../components/DeleteDatasetDialog';
import { useDatasets, useDeleteDataset } from '../hooks/useDatasets';
import type { Dataset } from '../types';

export function DatasetsPage() {
  const navigate = useNavigate();
  const datasetsQuery = useDatasets();
  const deleteMutation = useDeleteDataset();

  const [toDelete, setToDelete] = useState<Dataset | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      setToDelete(null);
    } catch (error) {
      setDeleteError(toApiError(error).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Datasets"
        description="Your enterprise dataset registry. Upload CSV files, inspect their schema, and prepare them for DataMart analytics, backtesting, and the AI assistant."
        actions={
          <Button onClick={() => navigate('/datasets/upload')}>
            <PlusIcon className="h-4 w-4" />
            Upload Dataset
          </Button>
        }
      />

      {datasetsQuery.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-24">
          <Spinner size="md" />
        </div>
      ) : datasetsQuery.isError ? (
        <ErrorState
          message={toApiError(datasetsQuery.error).message}
          onRetry={() => datasetsQuery.refetch()}
        />
      ) : datasetsQuery.data && datasetsQuery.data.datasets.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="No datasets yet"
          description="Upload transactional or analytical data to begin exploring your enterprise data."
          action={
            <Button onClick={() => navigate('/datasets/upload')}>
              <UploadIcon className="h-4 w-4" />
              Upload Dataset
            </Button>
          }
        />
      ) : (
        <DatasetTable
          datasets={datasetsQuery.data?.datasets ?? []}
          onDelete={(dataset) => {
            setDeleteError(null);
            setToDelete(dataset);
          }}
          deletingId={deleteMutation.isPending ? deleteMutation.variables ?? null : null}
        />
      )}

      <DeleteDatasetDialog
        open={toDelete !== null}
        dataset={toDelete}
        deleting={deleteMutation.isPending}
        onClose={() => {
          setToDelete(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
      />

      {deleteError ? (
        <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
          {deleteError}
        </p>
      ) : null}
    </div>
  );
}
