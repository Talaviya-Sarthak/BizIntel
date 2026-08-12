import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FolderIcon, UploadIcon } from '../../../components/ui/icons';
import { DatasetCard } from '../../datasets/components/DatasetCard';
import type { Dataset } from '../../datasets/types';

interface RecentDatasetsProps {
  datasets: Dataset[] | undefined;
  isLoading: boolean;
}

export function RecentDatasets({ datasets, isLoading }: RecentDatasetsProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-44 animate-pulse rounded-md border-2 border-white bg-ink-card shadow-brutal-sm"
          />
        ))}
      </div>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <EmptyState
        icon={FolderIcon}
        title="No datasets yet"
        description="Upload your first dataset to start analyzing enterprise data."
        action={
          <Button onClick={() => navigate('/datasets/upload')}>
            <UploadIcon className="h-4.5 w-4.5" />
            Upload Dataset
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {datasets.slice(0, 6).map((dataset) => (
          <DatasetCard key={dataset.id} dataset={dataset} />
        ))}
      </div>

      {datasets.length > 0 ? (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => navigate('/datasets')}>
            View all datasets
          </Button>
        </div>
      ) : null}
    </div>
  );
}
