import * as React from 'react';
import { StatCardProps } from './StatCard';
export interface StatCardRowProps {
  /** Card definitions; ignored when children are provided. */
  items?: StatCardProps[] | null;
  /** Uniform minimum card width in px. Cards never shrink below this — the row scrolls instead. */
  minWidth?: number;
  gap?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function StatCardRow(props: StatCardRowProps): JSX.Element;
