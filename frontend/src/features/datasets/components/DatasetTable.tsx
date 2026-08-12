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
    <div className="overflow-hidden border-2 border-white bg-black shadow-brutal-sm rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs font-bold uppercase tracking-wider">
          <thead>
            <tr className="border-b-2 border-white bg-ink-soft text-[10px] text-white">
              <th className="px-5 py-3.5 font-bold">Dataset Name</th>
              <th className="px-5 py-3.5 font-bold">File Type</th>
              <th className="px-5 py-3.5 text-right font-bold">Rows</th>
              <th className="px-5 py-3.5 text-right font-bold">Columns</th>
              <th className="px-5 py-3.5 text-right font-bold">Size</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
              <th className="px-5 py-3.5 font-bold">Created</th>
              <th className="px-5 py-3.5 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y border-white/20 bg-black text-white">
            {datasets.map((dataset) => (
              <tr key={dataset.id} className="transition-colors hover:bg-ink-card">
                <td className="px-5 py-4 normal-case">
                  <Link
                    to={`/datasets/${dataset.id}`}
                    className="block max-w-[280px] truncate font-bold text-white hover:text-lime text-sm"
                  >
                    {dataset.name}
                  </Link>
                  {dataset.description ? (
                    <p className="mt-0.5 block max-w-[280px] truncate text-xs text-muted font-semibold uppercase tracking-wider">
                      {dataset.description}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-muted font-bold truncate">{dataset.originalFilename}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="border-2 border-white bg-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white rounded-sm">
                    {dataset.fileType}
                  </span>
                </td>
                <td className="px-5 py-4 text-right text-white font-mono font-bold">
                  {formatNumber(dataset.rowCount)}
                </td>
                <td className="px-5 py-4 text-right text-white font-mono font-bold">
                  {formatNumber(dataset.columnCount)}
                </td>
                <td className="px-5 py-4 text-right text-muted font-mono font-bold">
                  {formatBytes(dataset.fileSize)}
                </td>
                <td className="px-5 py-4">
                  <DatasetStatusBadge status={dataset.status} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-muted font-mono font-bold text-[10px]">
                  {formatDate(dataset.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/datasets/${dataset.id}`}
                      className="inline-flex items-center gap-1.5 border-2 border-white bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition-all rounded-sm shadow-brutal-xs hover:translate-y-[1px] hover:bg-lime hover:text-black"
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
                      className="text-muted hover:text-pink border-0"
                    >
                      <TrashIcon className="h-4.5 w-4.5" />
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
