/** At-risk marker for a learner row. Pair with a one-line reason next to the name. */
export interface RiskBadgeProps { level?: 'warning' | 'danger'; label?: React.ReactNode; style?: React.CSSProperties }
export declare function RiskBadge(props: RiskBadgeProps): JSX.Element;
