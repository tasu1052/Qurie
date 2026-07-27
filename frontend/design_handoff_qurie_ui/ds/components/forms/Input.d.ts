/** Text/search input; supports icon and ⌘K-style shortcut hint. */
export interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  /** e.g. "⌘K" — renders a kbd hint on the right */
  shortcut?: string | null;
  icon?: React.ReactNode;
  disabled?: boolean;
  width?: number | string;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;