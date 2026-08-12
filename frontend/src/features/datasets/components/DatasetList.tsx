import { useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { Database, Trash2, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useDatasets, useDeleteDataset } from '../hooks/useDatasets';
import { toApiError } from '../../../lib/api';
import type { Dataset } from '../types';

interface DatasetListProps {
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onView: (dataset: Dataset) => void;
}

const STATUS_STYLES: Record<Dataset['status'], { badge: string; label: string }> = {
  ready: { badge: 'bg-emerald-400/10 text-emerald-400 ring-emerald-400/25', label: 'Ready' },
  processing: { badge: 'bg-yellow-400/10 text-yellow-400 ring-yellow-400/25', label: 'Processing' },
  pending: { badge: 'bg-slate-400/10 text-slate-400 ring-slate-400/25', label: 'Pending' },
  failed: { badge: 'bg-red-400/10 text-red-400 ring-red-400/25', label: 'Failed' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DatasetList({ page, limit, onPageChange, onView }: DatasetListProps) {
  const { data, isLoading, error } = useDatasets(page, limit);
  const deleteMutation = useDeleteDataset();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete(id: string) {
    setDeleteError(null);
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null);
      },
      onError: (err) => {
        const apiError = toApiError(err);
        setDeleteError(apiError.message);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading datasets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center">
        <p className="text-sm text-red-300">Failed to load datasets. Please try again.</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20">
        <Database className="h-12 w-12 text-slate-600" />
        <p className="mt-4 text-sm font-medium text-slate-300">No datasets yet</p>
        <p className="mt-1 text-xs text-slate-500">Upload a CSV file to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="px-4 py-3 font-medium text-slate-300">Name</th>
              <th className="px-4 py-3 font-medium text-slate-300">File</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Rows</th>
              <th className="px-4 py-3 font-medium text-slate-300">Status</th>
              <th className="px-4 py-3 font-medium text-slate-300">Created</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((ds) => {
              const status = STATUS_STYLES[ds.status];
              return (
                <tr
                  key={ds.id}
                  className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                  onClick={() => onView(ds)}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{ds.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {ds.filename}
                    <span className="ml-2 text-xs text-slate-500">
                      ({formatFileSize(ds.file_size)})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {ds.row_count?.toLocaleString() ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                        status.badge
                      )}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {format(new Date(ds.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onView(ds)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        title="View dataset"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {confirmDeleteId === ds.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(ds.id)}
                            loading={deleteMutation.isPending}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(ds.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          title="Delete dataset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of{' '}
            {data.total.toLocaleString()} datasets
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-400">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
