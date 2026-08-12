import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { AlertIcon } from '../../../components/ui/icons';
import { formatBytes, formatNumber } from '../../../utils/format';
import type { Dataset } from '../types';

interface DeleteDatasetDialogProps {
  open: boolean;
  dataset: Dataset | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDatasetDialog({
  open,
  dataset,
  deleting,
  onClose,
  onConfirm,
}: DeleteDatasetDialogProps) {
  return (
    <Modal
      open={open && dataset !== null}
      onClose={onClose}
      title="Delete dataset"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            loading={deleting}
            className="bg-red-500 text-white hover:bg-red-400 shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)]"
          >
            Delete dataset
          </Button>
        </>
      }
    >
      {dataset ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-slate-300">
            This will permanently delete{' '}
            <span className="font-medium text-white">{dataset.name}</span> and its{' '}
            <span className="font-medium text-white">{formatNumber(dataset.columnCount)}</span>{' '}
            columns ({formatNumber(dataset.rowCount)} rows, {formatBytes(dataset.fileSize)}).
            This action cannot be undone.
          </p>
          <p className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2.5 text-xs text-amber-300">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            The stored file will be removed from storage as well, so nothing is left behind.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
