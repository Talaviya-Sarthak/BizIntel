import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Input } from '../../../components/ui/Input';
import { InfoIcon } from '../../../components/ui/icons';
import { DatasetUploader } from '../components/DatasetUploader';
import type { Dataset } from '../types';

export function DatasetUploadPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Upload Dataset"
        description="Upload a CSV file. It will be validated, profiled with DuckDB, and stored in the dataset registry."
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-[#181818] px-4 py-3 text-xs text-zinc-300 shadow-sm">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
        <p>
          CSV is supported. Parquet, Excel, and JSON ingest run on top of the same high-speed DuckDB analytics engine.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Dataset name"
          placeholder="e.g. Sales Transactions"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Description (optional)"
          placeholder="What does this dataset represent?"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <DatasetUploader
        name={name.trim() || undefined}
        description={description.trim() || undefined}
        onUploaded={(dataset: Dataset) => navigate(`/datasets/${dataset.id}`)}
      />
    </div>
  );
}
