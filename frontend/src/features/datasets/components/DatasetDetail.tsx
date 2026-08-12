import { useState } from 'react';
import { clsx } from 'clsx';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useDataset, useDatasetPreview, useDeleteDataset } from '../hooks/useDatasets';
import { toApiError } from '../../../lib/api';
import type { Dataset, DatasetStatus, DatasetColumn } from '../types';

interface DatasetDetailProps {
  dataset: Dataset;
  onBack: () => void;
  onDeleted: () => void;
}

const STATUS_STYLES: Record<DatasetStatus, { badge: string; label: string }> = {
  READY: { badge: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/25', label: 'Ready' },
  PROCESSING: { badge: 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/25', label: 'Processing' },
  UPLOADING: { badge: 'bg-slate-400/10 text-slate-400 ring-slate-400/25', label: 'Uploading' },
  VALIDATING: { badge: 'bg-blue-400/10 text-blue-400 ring-blue-400/25', label: 'Validating' },
  FAILED: { badge: 'bg-red-400/10 text-red-400 ring-red-400/25', label: 'Failed' },
  DELETED: { badge: 'bg-slate-400/10 text-slate-500 ring-slate-400/25', label: 'Deleted' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function DatasetDetail({ dataset: initialDataset, onBack, onDeleted }: DatasetDetailProps) {
  const { data: detailData } = useDataset(initialDataset.id);
  const { data: previewData, isLoading: previewLoading } = useDatasetPreview(initialDataset.id);
  const deleteMutation = useDeleteDataset();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const ds = detailData?.dataset ?? initialDataset;
  const columns: DatasetColumn[] = detailData?.columns ?? [];
  const status = STATUS_STYLES[ds.status];

  function handleDelete() {
    setDeleteError(null);
    deleteMutation.mutate(ds.id, {
      onSuccess: () => onDeleted(),
      onError: (err) => {
        const apiError = toApiError(err);
        setDeleteError(apiError.message);
        setConfirmDelete(false);
      },
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowUpRight className="h-3 w-3 rotate-[-90deg]" />
            Back to datasets
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-white">{ds.name}</h2>
          {ds.description && (
            <p className="text-sm text-slate-400">{ds.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleteMutation.isPending}>
                Confirm Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Filename', value: ds.originalFilename },
          { label: 'File Size', value: formatFileSize(ds.fileSize) },
          { label: 'Rows', value: ds.rowCount?.toLocaleString() ?? '—' },
          { label: 'Columns', value: String(ds.columnCount ?? columns.length) },
          { label: 'Status', value: null },
          { label: 'Created', value: formatDate(ds.createdAt) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-slate-500">{item.label}</p>
            {item.label === 'Status' ? (
              <span
                className={clsx(
                  'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                  status.badge
                )}
              >
                {status.label}
              </span>
            ) : (
              <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      {columns.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white">Column Schema</h3>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-4 py-2.5 font-medium text-slate-300">Column</th>
                  <th className="px-4 py-2.5 font-medium text-slate-300">Type</th>
                  <th className="px-4 py-2.5 font-medium text-slate-300">Nullable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {columns.map((col: DatasetColumn) => (
                  <tr key={col.columnName}>
                    <td className="px-4 py-2 font-medium text-white">{col.columnName}</td>
                    <td className="px-4 py-2 text-slate-400">
                      <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs">{col.dataType}</code>
                    </td>
                    <td className="px-4 py-2 text-slate-400">{col.nullable ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-white">Data Preview</h3>
        {previewLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
        ) : !previewData?.preview.length ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center">
            <p className="text-sm text-slate-400">No data to preview</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  {columns.map((col: DatasetColumn) => (
                    <th key={col.columnName} className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-300">
                      {col.columnName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {previewData.preview.map((row: Record<string, unknown>, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    {columns.map((col: DatasetColumn) => (
                      <td key={col.columnName} className="whitespace-nowrap px-3 py-2 text-slate-400">
                        {row[col.columnName] != null ? String(row[col.columnName]) : <span className="text-slate-600">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
