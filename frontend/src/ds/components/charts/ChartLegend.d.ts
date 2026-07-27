import * as React from 'react';
export interface ChartLegendItem {
  label: React.ReactNode;
  /** Indigo (accent) swatch for the highlighted series. */
  accent?: boolean;
  /** Explicit swatch color (CSS var token only). */
  color?: string;
}
export interface ChartLegendProps {
  items: ChartLegendItem[];
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}
export declare function ChartLegend(props: ChartLegendProps): JSX.Element;
