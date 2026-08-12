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
          'flex flex-col items-center justify-center border-2 border-dashed px-6 py-14 text-center transition-all duration-150 rounded-md outline-none',
          dragActive
            ? 'border-lime bg-lime/5 shadow-[4px_4px_0px_#C6FF00]'
            : 'border-white bg-ink-card hover:border-lime focus:border-lime',
        )}
      >
        <span className="inline-flex h-14 w-14 items-center justify-center border-2 border-lime bg-lime/10 text-lime rounded-sm">
          <UploadIcon className="h-7 w-7" />
        </span>
        <p className="mt-5 text-sm font-bold uppercase tracking-wider text-white">
          Drag & drop your CSV file here
        </p>
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          or{' '}
          <span className="text-lime hover:underline cursor-pointer">browse your files</span> · up to{' '}
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
        <div className="flex flex-col gap-4 border-2 border-white bg-ink-card p-5 rounded-md shadow-brutal-sm">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-lime bg-lime/10 text-lime rounded-sm">
              <FileIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold uppercase tracking-wider text-white">{file.name}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">
                {formatBytes(file.size)} · {file.type || 'text/csv'}
              </p>
            </div>
            {phase === 'success' && uploaded ? (
              <CheckCircleIcon className="h-6 w-6 shrink-0 text-lime" />
            ) : phase === 'error' ? (
              <XCircleIcon className="h-6 w-6 shrink-0 text-pink" />
            ) : null}
          </div>

          {phase === 'uploading' || phase === 'processing' ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-white">
                  {phase === 'processing' ? 'Processing dataset with DuckDB…' : 'Uploading…'}
                </span>
                <span className="text-muted">
                  {phase === 'processing' ? 'Analyzing' : `${progress}%`}
                </span>
              </div>
              <div className="h-3 overflow-hidden border-2 border-white bg-black rounded-sm">
                <div
                  className={clsx(
                    'h-full bg-lime transition-all duration-300',
                    phase === 'processing' && 'animate-pulse',
                  )}
                  style={{ width: phase === 'processing' ? '100%' : `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {phase === 'success' && uploaded ? (
            <p className="text-xs font-bold uppercase tracking-wider text-lime">
              {uploaded.name} is ready with {uploaded.rowCount?.toLocaleString() ?? 0} rows across {uploaded.columnCount ?? 0} columns.
            </p>
          ) : null}

          {phase === 'error' ? (
            <p className="border-2 border-pink bg-pink/5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-pink rounded-sm">
              {error}
            </p>
          ) : null}

          {phase === 'idle' || phase === 'error' || phase === 'success' ? (
            <div className="flex items-center gap-3">
              {phase === 'idle' ? (
                <Button onClick={handleUpload} loading={isPending}>
                  <UploadIcon className="h-4.5 w-4.5" />
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
