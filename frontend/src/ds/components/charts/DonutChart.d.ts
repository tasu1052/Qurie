/** Donut/ring chart for proportional breakdowns; accent segment indigo, rest grayscale. */
export interface DonutChartProps {
  segments?: Array<{ label: string; value: number; accent?: boolean }>;
  size?: number;
  thickness?: number;
  centerValue?: React.ReactNode;
  centerLabel?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function DonutChart(props: DonutChartProps): JSX.Element;