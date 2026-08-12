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
            variant="danger"
          >
            Delete dataset
          </Button>
        </>
      }
    >
      {dataset ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted leading-relaxed">
            This will permanently delete{' '}
            <span className="font-black text-white">{dataset.name}</span> and its{' '}
            <span className="font-black text-white">{formatNumber(dataset.columnCount)}</span>{' '}
            columns ({formatNumber(dataset.rowCount)} rows, {formatBytes(dataset.fileSize)}).
            This action cannot be undone.
          </p>
          <p className="flex items-start gap-2.5 border-2 border-yellow bg-yellow/5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-yellow rounded-sm">
            <AlertIcon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            The stored file will be removed from storage as well, so nothing is left behind.
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
