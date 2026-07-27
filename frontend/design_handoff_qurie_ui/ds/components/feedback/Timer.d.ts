/** Calm quiz countdown — circular ring or thin bar, indigo sweep, never alarming. */
export interface TimerProps {
  totalSeconds?: number;
  /** controlled remaining time; omit to let the component tick itself when running */
  remainingSeconds?: number | null;
  running?: boolean;
  size?: number;
  variant?: 'ring' | 'bar';
  label?: React.ReactNode;
  onComplete?: () => void;
  style?: React.CSSProperties;
}
export declare function Timer(props: TimerProps): JSX.Element;