import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { EyeIcon, TrashIcon } from '../../../components/ui/icons';
import { formatBytes, formatDate, formatNumber } from '../../../utils/format';
import type { Dataset } from '../types';
import { DatasetStatusBadge } from './DatasetStatusBadge';

interface DatasetTableProps {
  datasets: Dataset[];
  onDelete: (dataset: Dataset) => void;
  deletingId: string | null;
}

export function DatasetTable({ datasets, onDelete, deletingId }: DatasetTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-semibold">Dataset Name</th>
              <th className="px-5 py-3 font-semibold">File Type</th>
              <th className="px-5 py-3 text-right font-semibold">Rows</th>
              <th className="px-5 py-3 text-right font-semibold">Columns</th>
              <th className="px-5 py-3 text-right font-semibold">Size</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Created</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {datasets.map((dataset) => (
              <tr key={dataset.id} className="transition hover:bg-white/[0.03]">
                <td className="px-5 py-4">
                  <Link
                    to={`/datasets/${dataset.id}`}
                    className="block max-w-[280px] truncate font-medium text-white hover:text-cyan-300"
                  >
                    {dataset.name}
                  </Link>
                  {dataset.description ? (
                    <p className="mt-0.5 block max-w-[280px] truncate text-xs text-slate-500">
                      {dataset.description}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-600">{dataset.originalFilename}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                    {dataset.fileType}
                  </span>
                </td>
                <td className="px-5 py-4 text-right text-slate-300">
                  {formatNumber(dataset.rowCount)}
                </td>
                <td className="px-5 py-4 text-right text-slate-300">
                  {formatNumber(dataset.columnCount)}
                </td>
                <td className="px-5 py-4 text-right text-slate-400">
                  {formatBytes(dataset.fileSize)}
                </td>
                <td className="px-5 py-4">
                  <DatasetStatusBadge status={dataset.status} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                  {formatDate(dataset.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/datasets/${dataset.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/50 hover:text-white"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      View
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(dataset)}
                      loading={deletingId === dataset.id}
                      aria-label={`Delete ${dataset.name}`}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
