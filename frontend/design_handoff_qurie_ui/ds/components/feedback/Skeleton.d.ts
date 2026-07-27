/** Opacity-pulse placeholder block. Never a shimmer gradient. */
export interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  circle?: boolean;
  /** Animation delay in seconds — stagger sibling blocks by 0.08–0.12. */
  delay?: number;
  animate?: boolean;
  style?: React.CSSProperties;
}
export declare function Skeleton(props: SkeletonProps): JSX.Element;
export interface SkeletonTextProps { lines?: number; gap?: number; widths?: (number | string)[]; style?: React.CSSProperties; }
export declare function SkeletonText(props: SkeletonTextProps): JSX.Element;
