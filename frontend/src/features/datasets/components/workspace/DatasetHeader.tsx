import { clsx } from 'clsx';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button';
import { DatasetStatusBadge } from '../DatasetStatusBadge';
import {
  ChevronRightIcon,
  ClockIcon,
  ColumnsIcon,
  DownloadIcon,
  RefreshIcon,
  RowsIcon,
  TrashIcon,
} from '../../../../components/ui/icons';
import type { Dataset } from '../../types';
import { formatBytes, formatDate, formatNumber } from '../../../../utils/format';

interface DatasetHeaderProps {
  dataset: Dataset;
  columnsCount?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  downloading?: boolean;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function DatasetHeader({
  dataset,
  columnsCount,
  refreshing,
  onRefresh,
  downloading,
  onDownload,
  onDelete,
}: DatasetHeaderProps) {
  const isReady = dataset.status === 'READY';

  return (
    <header className="flex flex-col gap-5 bg-black">
      <Link
        to="/datasets"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted transition-colors hover:text-lime"
      >
        <ChevronRightIcon className="h-4 w-4 rotate-180" />
        Back to Datasets
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              {dataset.name}
            </h1>
            <DatasetStatusBadge status={dataset.status} />
          </div>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">
            {dataset.description ?? dataset.originalFilename}
          </p>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-muted">
            <MetaItem icon={RowsIcon} label="Rows" value={formatNumber(dataset.rowCount)} />
            <MetaItem
              icon={ColumnsIcon}
              label="Columns"
              value={formatNumber(columnsCount ?? dataset.columnCount)}
            />
            <MetaItem label="Type" value={dataset.fileType.toUpperCase()} />
            <MetaItem label="Size" value={formatBytes(dataset.fileSize)} />
            <MetaItem icon={ClockIcon} label="Updated" value={formatDate(dataset.updatedAt)} />
          </dl>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={refreshing}
            onClick={onRefresh}
            disabled={!isReady}
          >
            <RefreshIcon className="h-4.5 w-4.5" />
            Refresh analysis
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={downloading}
            onClick={onDownload}
            disabled={!isReady}
          >
            <DownloadIcon className="h-4.5 w-4.5" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className={clsx('text-muted hover:text-pink border-0')}
          >
            <TrashIcon className="h-4.5 w-4.5" />
            Delete
          </Button>
        </div>
      </div>
    </header>
  );
}

interface MetaItemProps {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}

function MetaItem({ label, value, icon: Icon }: MetaItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Icon ? <Icon className="h-4 w-4 text-white" /> : null}
      <dt className="uppercase tracking-wider">{label}:</dt>
      <dd className="font-black text-white">{value}</dd>
    </div>
  );
}
