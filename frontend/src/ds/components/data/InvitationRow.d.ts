/** One invitation in the pending list, with its resend / cancel actions. */
export interface InvitationRowProps {
  email: string;
  /** "MANAGER · 2026-07-25 발송 · 만료 D-1" */
  meta?: React.ReactNode;
  status?: 'PENDING' | 'EXPIRED' | 'ACCEPTED';
  /** Seconds left on the resend cooldown; 0 enables the button. */
  cooldownSec?: number;
  onResend?: () => void;
  onCancel?: () => void;
  /** Replaces the actions when ACCEPTED (e.g. a link to the member). */
  trailing?: React.ReactNode;
}
export declare function InvitationRow(props: InvitationRowProps): JSX.Element;
