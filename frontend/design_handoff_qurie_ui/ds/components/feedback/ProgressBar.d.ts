/** 6px indigo track. Omit `value` for an indeterminate sweep. */
export interface ProgressBarProps {
  value?: number | null;
  label?: React.ReactNode;
  /** Right-side text; defaults to "NN%" in mono when value is set. */
  hint?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
