import { Link } from 'react-router-dom';
import { FileIcon } from '../../../components/ui/icons';
import { formatBytes, formatNumber, formatRelativeTime } from '../../../utils/format';
import type { Dataset } from '../types';
import { DatasetStatusBadge } from './DatasetStatusBadge';

interface DatasetCardProps {
  dataset: Dataset;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  return (
    <Link
      to={`/datasets/${dataset.id}`}
      className="group flex flex-col rounded-xl border border-white/[0.06] bg-[#181818] p-4 shadow-sm transition-all hover:border-white/20 hover:bg-[#1a1a1a]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
          <FileIcon className="h-4 w-4" />
        </span>
        <DatasetStatusBadge status={dataset.status} />
      </div>

      <h3 className="mt-3 truncate text-xs font-semibold text-zinc-100 group-hover:text-white">
        {dataset.name}
      </h3>
      {dataset.description ? (
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
          {dataset.description}
        </p>
      ) : (
        <p className="mt-1 truncate text-[11px] text-zinc-500">{dataset.originalFilename}</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
        <div>
          <dt className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Rows</dt>
          <dd className="mt-0.5 text-xs font-semibold text-zinc-200 font-mono">
            {formatNumber(dataset.rowCount)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Columns</dt>
          <dd className="mt-0.5 text-xs font-semibold text-zinc-200 font-mono">
            {formatNumber(dataset.columnCount)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Size</dt>
          <dd className="mt-0.5 text-xs font-semibold text-zinc-200 font-mono">
            {formatBytes(dataset.fileSize)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[10.5px] text-zinc-500">
        Created {formatRelativeTime(dataset.createdAt)}
      </p>
    </Link>
  );
}
