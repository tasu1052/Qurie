/** Qurie button — solid black primary, outlined secondary, ghost tertiary.
 * @startingPoint section="Actions" subtitle="Primary, secondary, ghost buttons" viewport="700x200" */
export interface ButtonProps {
  /** 'primary' solid black | 'secondary' outlined | 'ghost' text-only | 'accent' indigo (sparingly) */
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Optional leading icon node (Lucide-style 16px) */
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;