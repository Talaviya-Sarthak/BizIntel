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
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-elevated shadow-2xl"
      >
        {title ? (
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="text-base font-semibold text-white">{title}</h2>
          </div>
        ) : null}
        <div className={clsx('px-6 py-5', footer && 'pb-4')}>{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
