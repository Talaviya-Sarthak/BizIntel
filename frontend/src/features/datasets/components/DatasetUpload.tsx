import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { clsx } from 'clsx';
import { Upload, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useUploadDataset } from '../hooks/useDatasets';
import { toApiError } from '../../../lib/api';

interface DatasetUploadProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DatasetUpload({ onSuccess, onCancel }: DatasetUploadProps) {
  const uploadDataset = useUploadDataset();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      if (!name) {
        setName(accepted[0].name.replace(/\.csv$/i, ''));
      }
      setError(null);
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    multiple: false,
  });

  function handleUpload() {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a name for the dataset');
      return;
    }

    setError(null);
    uploadDataset.mutate(
      { file, name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setFile(null);
          setName('');
          setDescription('');
          onSuccess?.();
        },
        onError: (err: unknown) => {
          const apiError = toApiError(err);
          setError(apiError.message);
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div
        {...getRootProps()}
        className={clsx(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
          isDragActive
            ? 'border-cyan-400/60 bg-cyan-400/5'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-cyan-400" />
            <p className="text-sm font-medium text-white">{file.name}</p>
            <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-300">
              {isDragActive ? 'Drop your CSV here' : 'Drag & drop a CSV file, or click to browse'}
            </p>
            <p className="text-xs text-slate-500">Max file size: 50 MB</p>
          </div>
        )}
      </div>

      <Input
        id="dataset-name"
        label="Name"
        placeholder="e.g. Q4 Sales Data"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        id="dataset-description"
        label="Description (optional)"
        placeholder="Brief description of the dataset"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={handleUpload}
          loading={uploadDataset.isPending}
          disabled={!file}
        >
          Upload Dataset
        </Button>
      </div>
    </div>
  );
}
