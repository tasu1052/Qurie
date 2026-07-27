/** Dropdown selector; size='sm' fits inline in table rows (e.g. role assignment). */
export interface SelectProps {
  options?: Array<string | { value: string; label: React.ReactNode }>;
  value?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Select(props: SelectProps): JSX.Element;