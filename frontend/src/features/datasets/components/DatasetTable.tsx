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
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#181818] shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.06] text-left text-xs">
          <thead>
            <tr className="text-[10.5px] uppercase font-semibold tracking-wider text-zinc-400 bg-zinc-900/60">
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
          <tbody className="divide-y divide-white/[0.04]">
            {datasets.map((dataset) => (
              <tr key={dataset.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-5 py-3.5">
                  <Link
                    to={`/datasets/${dataset.id}`}
                    className="block max-w-[280px] truncate font-semibold text-zinc-100 hover:text-white"
                  >
                    {dataset.name}
                  </Link>
                  {dataset.description ? (
                    <p className="mt-0.5 block max-w-[280px] truncate text-[11px] text-zinc-400">
                      {dataset.description}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-zinc-500">{dataset.originalFilename}</p>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded border border-white/[0.08] bg-zinc-900 px-2 py-0.5 text-[10.5px] uppercase font-mono text-zinc-400">
                    {dataset.fileType}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-zinc-300 font-mono">
                  {formatNumber(dataset.rowCount)}
                </td>
                <td className="px-5 py-3.5 text-right text-zinc-300 font-mono">
                  {formatNumber(dataset.columnCount)}
                </td>
                <td className="px-5 py-3.5 text-right text-zinc-400 font-mono">
                  {formatBytes(dataset.fileSize)}
                </td>
                <td className="px-5 py-3.5">
                  <DatasetStatusBadge status={dataset.status} />
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-zinc-400 text-[11px]">
                  {formatDate(dataset.createdAt)}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/datasets/${dataset.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
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
                      className="text-zinc-400 hover:text-red-400"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
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
