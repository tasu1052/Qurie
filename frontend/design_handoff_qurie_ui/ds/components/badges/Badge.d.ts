/** Pill-shaped status/role badge (ADMIN, PENDING, ACCEPTED…). Uppercase, desaturated semantic colors.
 * @startingPoint section="Badges" subtitle="Status & role pills" viewport="700x160" */
export interface BadgeProps {
  /** semantic color set */
  status?: 'success' | 'warning' | 'error' | 'neutral' | 'accent' | 'ink';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;