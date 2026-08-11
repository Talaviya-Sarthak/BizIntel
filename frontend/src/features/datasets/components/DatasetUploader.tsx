import { useRef, useState, type DragEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { CheckCircleIcon, FileIcon, UploadIcon, XCircleIcon } from '../../../components/ui/icons';
import { clsx } from 'clsx';
import { toApiError } from '../../../lib/api';
import { formatBytes } from '../../../utils/format';
import type { Dataset, DatasetUploadInput } from '../types';
import { useUploadDataset } from '../hooks/useDatasets';

interface DatasetUploaderProps {
  maxSizeMb?: number;
  /** Optional metadata included with the upload. */
  name?: string;
  description?: string;
  /** Called with the processed dataset once the server responds. */
  onUploaded: (dataset: Dataset) => void;
}

type Phase = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

const ACCEPTED_EXTENSIONS = new Set(['.csv']);
const DEFAULT_MAX_MB = 100;

export function DatasetUploader({
  maxSizeMb = DEFAULT_MAX_MB,
  name,
  description,
  onUploaded,
}: DatasetUploaderProps) {
  const { mutateAsync, isPending } = useUploadDataset();

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Dataset | null>(null);

  function selectFile(candidate: File) {
    const extension = candidate.name.slice(candidate.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.has(extension)) {
      setFile(null);
      setPhase('error');
      setError('Only CSV files are supported. Select a file ending in .csv.');
      return;
    }
    if (candidate.size === 0) {
      setFile(null);
      setPhase('error');
      setError('The file is empty. Upload a CSV with at least a header row.');
      return;
    }
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      setFile(null);
      setPhase('error');
      setError(`File exceeds the maximum allowed size of ${maxSizeMb} MB.`);
      return;
    }
    setFile(candidate);
    setPhase('idle');
    setError(null);
  }

  async function handleUpload() {
    if (!file || isPending) return;

    const input: DatasetUploadInput = { file, name, description };
    setPhase('uploading');
    setProgress(0);
    setError(null);

    input.onProgress = (percent) => {
      setProgress(percent);
      if (percent >= 100) setPhase('processing');
    };

    try {
      const dataset = await mutateAsync(input);
      if (dataset.status === 'READY') {
        setPhase('success');
        setUploaded(dataset);
        onUploaded(dataset);
      } else {
        setPhase('error');
        setError(
          dataset.errorMessage ??
            'The dataset could not be processed. Review the file and try again.',
        );
      }
    } catch (uploadError) {
      setPhase('error');
      setError(toApiError(uploadError).message);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) selectFile(dropped);
  }

  function reset() {
    setFile(null);
    setPhase('idle');
    setProgress(0);
    setError(null);
    setUploaded(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a CSV file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={clsx(
          'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition',
          dragActive
            ? 'border-cyan-400/70 bg-cyan-400/[0.06]'
            : 'border-white/15 bg-white/[0.02] hover:border-cyan-400/40',
        )}
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
          <UploadIcon className="h-7 w-7" />
        </span>
        <p className="mt-5 text-sm font-medium text-white">
          Drag & drop your CSV file here
        </p>
        <p className="mt-1 text-xs text-slate-500">
          or{' '}
          <span className="font-medium text-cyan-400">browse your files</span> · up to{' '}
          {maxSizeMb} MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) selectFile(selected);
          }}
        />
      </div>

      {file ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
              <FileIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{file.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatBytes(file.size)} · {file.type || 'text/csv'}
              </p>
            </div>
            {phase === 'success' && uploaded ? (
              <CheckCircleIcon className="h-6 w-6 shrink-0 text-emerald-400" />
            ) : phase === 'error' ? (
              <XCircleIcon className="h-6 w-6 shrink-0 text-red-400" />
            ) : null}
          </div>

          {phase === 'uploading' || phase === 'processing' ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">
                  {phase === 'processing' ? 'Processing dataset with DuckDB…' : 'Uploading…'}
                </span>
                <span className="text-slate-500">
                  {phase === 'processing' ? 'Analyzing' : `${progress}%`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={clsx(
                    'h-full rounded-full bg-cyan-400 transition-all duration-300',
                    phase === 'processing' && 'animate-pulse',
                  )}
                  style={{ width: phase === 'processing' ? '100%' : `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {phase === 'success' && uploaded ? (
            <p className="text-sm text-emerald-300">
              {uploaded.name} is ready with {uploaded.rowCount?.toLocaleString() ?? 0} rows
              across {uploaded.columnCount ?? 0} columns.
            </p>
          ) : null}

          {phase === 'error' ? (
            <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2.5 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          {phase === 'idle' || phase === 'error' || phase === 'success' ? (
            <div className="flex items-center gap-3">
              {phase === 'idle' ? (
                <Button onClick={handleUpload} loading={isPending}>
                  <UploadIcon className="h-4 w-4" />
                  Upload dataset
                </Button>
              ) : null}
              <Button variant="ghost" onClick={reset}>
                Choose a different file
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
