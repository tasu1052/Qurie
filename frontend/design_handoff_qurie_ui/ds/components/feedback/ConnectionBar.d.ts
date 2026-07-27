/** Realtime session health for Room / editor surfaces. */
export interface ConnectionBarProps {
  status?: 'connected' | 'reconnecting' | 'offline';
  /** Right-side plain detail: "CRDT 세션 복구 시도 2/5", "Seoul Server · 지연 42ms". */
  detail?: React.ReactNode;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function ConnectionBar(props: ConnectionBarProps): JSX.Element;
