/** Centered card modal for invitation/class-creation/role flows; scrim + primary/secondary actions.
 * @startingPoint section="Overlays" subtitle="Centered dialog with actions" viewport="700x400" */
export interface ModalProps {
  open?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  primaryLabel?: string | null;
  secondaryLabel?: string | null;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
  width?: number;
  style?: React.CSSProperties;
}
export declare function Modal(props: ModalProps): JSX.Element;