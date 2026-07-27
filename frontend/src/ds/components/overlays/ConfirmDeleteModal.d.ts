/** Type-the-name confirmation gate for destructive actions. */
export interface ConfirmDeleteModalProps {
  title: React.ReactNode;
  description: React.ReactNode;
  /** The exact string the user must type — the record's own name. */
  confirmText: string;
  typed?: string;
  /** Short strings describing child data that goes with the record ("세션 24"). */
  childCounts?: string[];
  /** Server returned 409 CONFLICT — forces the cascade opt-in. */
  conflict?: boolean;
  cascade?: boolean;
  onCascadeChange?: (next: boolean) => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
}
export declare function ConfirmDeleteModal(props: ConfirmDeleteModalProps): JSX.Element;
