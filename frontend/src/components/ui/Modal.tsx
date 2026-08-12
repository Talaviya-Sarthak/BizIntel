import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md border-2 border-white bg-ink-card rounded-md shadow-brutal"
      >
        {title ? (
          <div className="border-b-2 border-white px-6 py-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">{title}</h2>
          </div>
        ) : null}
        <div className={clsx('px-6 py-5', footer && 'pb-4')}>{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t-2 border-white px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
