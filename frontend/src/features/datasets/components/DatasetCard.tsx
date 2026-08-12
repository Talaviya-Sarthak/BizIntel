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
      className="group flex flex-col border-2 border-white bg-ink-card p-5 shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 rounded-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-lime bg-lime/10 text-lime">
          <FileIcon className="h-5 w-5" />
        </span>
        <DatasetStatusBadge status={dataset.status} />
      </div>

      <h3 className="mt-4 truncate text-sm font-bold uppercase tracking-wider text-white group-hover:text-lime transition-colors">
        {dataset.name}
      </h3>
      {dataset.description ? (
        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-muted uppercase tracking-wider">
          {dataset.description}
        </p>
      ) : (
        <p className="mt-1 truncate text-xs text-muted font-bold uppercase tracking-wider">{dataset.originalFilename}</p>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t-2 border-white pt-4 text-center">
        <div>
          <dt className="text-[9px] font-bold uppercase tracking-widest text-muted">Rows</dt>
          <dd className="mt-0.5 text-xs font-bold text-white">
            {formatNumber(dataset.rowCount)}
          </dd>
        </div>
        <div>
          <dt className="text-[9px] font-bold uppercase tracking-widest text-muted">Columns</dt>
          <dd className="mt-0.5 text-xs font-bold text-white">
            {formatNumber(dataset.columnCount)}
          </dd>
        </div>
        <div>
          <dt className="text-[9px] font-bold uppercase tracking-widest text-muted">Size</dt>
          <dd className="mt-0.5 text-xs font-bold text-white">
            {formatBytes(dataset.fileSize)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-muted">
        Created {formatRelativeTime(dataset.createdAt)}
      </p>
    </Link>
  );
}
