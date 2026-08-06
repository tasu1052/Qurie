/** Line chart: ink series + one indigo accent series, hairline grid. */
export interface LineChartProps {
  series?: Array<{ name?: string; values: number[]; accent?: boolean }>;
  labels?: string[];
  height?: number;
  width?: number | string;
  showDots?: boolean;
  xAxisLabel?: string | null;
  yAxisLabel?: string | null;
  style?: React.CSSProperties;
}
export declare function LineChart(props: LineChartProps): JSX.Element;