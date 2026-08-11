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
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/30 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
          <FileIcon className="h-5 w-5" />
        </span>
        <DatasetStatusBadge status={dataset.status} />
      </div>

      <h3 className="mt-4 truncate text-sm font-semibold text-white group-hover:text-cyan-300">
        {dataset.name}
      </h3>
      {dataset.description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
          {dataset.description}
        </p>
      ) : (
        <p className="mt-1 truncate text-xs text-slate-500">{dataset.originalFilename}</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-4 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Rows</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-200">
            {formatNumber(dataset.rowCount)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Columns</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-200">
            {formatNumber(dataset.columnCount)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-slate-500">Size</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-200">
            {formatBytes(dataset.fileSize)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-[11px] text-slate-500">
        Created {formatRelativeTime(dataset.createdAt)}
      </p>
    </Link>
  );
}
