import type { ReactNode } from 'react';
import { useState } from 'react';
import { ConfirmDeleteModal } from '../../ds';

type ConfirmDeleteOverlayProps = {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmText: string;
  childCounts?: string[];
  conflict?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
};

/** Glass scrim + ConfirmDeleteModal for destructive deletes (7a). */
export function ConfirmDeleteOverlay({
  open,
  title,
  description,
  confirmText,
  childCounts = [],
  conflict = false,
  onClose,
  onConfirm,
  confirmLabel = '삭제',
}: ConfirmDeleteOverlayProps) {
  const [typed, setTyped] = useState('');
  const [cascade, setCascade] = useState(false);

  if (!open) return null;

  const resetAndClose = () => {
    setTyped('');
    setCascade(false);
    onClose();
  };

  return (
    <div
      role="presentation"
      onClick={resetAndClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
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
          childCounts={childCounts}
          conflict={conflict}
          cascade={cascade}
          onCascadeChange={setCascade}
          onCancel={resetAndClose}
          onConfirm={() => {
            onConfirm();
            resetAndClose();
          }}
          confirmLabel={confirmLabel}
        />
      </div>
    </div>
  );
}
