import type { ReactNode } from 'react';
import { useState } from 'react';
import { ConfirmDeleteModal } from '../../ds';

type ConfirmDeleteOverlayProps = {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmText: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  /** When false, parent closes overlay after async delete succeeds. Default true. */
  closeOnConfirm?: boolean;
  /** When false, skip type-to-confirm and show a simple yes/no. Default true. */
  requireTyped?: boolean;
};

/** Glass scrim + ConfirmDeleteModal for destructive deletes (7a). */
export function ConfirmDeleteOverlay({
  open,
  title,
  description,
  confirmText,
  onClose,
  onConfirm,
  confirmLabel = '삭제',
  closeOnConfirm = true,
  requireTyped = true,
}: ConfirmDeleteOverlayProps) {
  const [typed, setTyped] = useState('');

  if (!open) return null;

  const resetAndClose = () => {
    setTyped('');
    onClose();
  };

  return (
    <div
      role="presentation"
      onClick={resetAndClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'var(--font-sans)',
        background: 'var(--scrim-modal)',
        backdropFilter: 'blur(10px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.15)',
      }}
    >
      <div role="presentation" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440 }}>
        <ConfirmDeleteModal
          title={title}
          description={description}
          confirmText={confirmText}
          typed={typed}
          onTypedChange={setTyped}
          requireTyped={requireTyped}
          onCancel={resetAndClose}
          onConfirm={() => {
            onConfirm();
            if (closeOnConfirm) resetAndClose();
          }}
          confirmLabel={confirmLabel}
        />
      </div>
    </div>
  );
}
