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
  name?: string;
  description?: string;
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
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-all',
          dragActive
            ? 'border-white/40 bg-zinc-800/80'
            : 'border-white/[0.08] bg-[#181818] hover:border-white/25',
        )}
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
          <UploadIcon className="h-6 w-6" />
        </span>
        <p className="mt-4 text-xs font-semibold text-zinc-100">
          Drag & drop your CSV file here
        </p>
        <p className="mt-1 text-[11px] text-zinc-400">
          or{' '}
          <span className="font-semibold text-zinc-200 underline">browse your files</span> · up to{' '}
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
        <div className="flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-[#181818] p-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-xs">
              <FileIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-100">{file.name}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400 font-mono">
                {formatBytes(file.size)} · {file.type || 'text/csv'}
              </p>
            </div>
            {phase === 'success' && uploaded ? (
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : phase === 'error' ? (
              <XCircleIcon className="h-5 w-5 shrink-0 text-red-400" />
            ) : null}
          </div>

          {phase === 'uploading' || phase === 'processing' ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">
                  {phase === 'processing' ? 'Processing dataset with DuckDB…' : 'Uploading…'}
                </span>
                <span className="text-zinc-400 font-mono">
                  {phase === 'processing' ? 'Analyzing' : `${progress}%`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={clsx(
                    'h-full rounded-full bg-white transition-all duration-300',
                    phase === 'processing' && 'animate-pulse',
                  )}
                  style={{ width: phase === 'processing' ? '100%' : `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {phase === 'success' && uploaded ? (
            <p className="text-xs text-emerald-300">
              {uploaded.name} is ready with {uploaded.rowCount?.toLocaleString() ?? 0} rows
              across {uploaded.columnCount ?? 0} columns.
            </p>
          ) : null}

          {phase === 'error' ? (
            <p className="rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          ) : null}

          {phase === 'idle' || phase === 'error' || phase === 'success' ? (
            <div className="flex items-center gap-3">
              {phase === 'idle' ? (
                <Button onClick={handleUpload} loading={isPending} className="bg-white text-black font-semibold text-xs hover:bg-zinc-200">
                  <UploadIcon className="h-3.5 w-3.5" />
                  Upload dataset
                </Button>
              ) : null}
              <Button variant="ghost" onClick={reset} className="text-xs text-zinc-400 hover:text-white">
                Choose a different file
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
