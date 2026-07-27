/** Bar chart: ink bars, single indigo highlight bar. */
export interface BarChartProps {
  data?: Array<{ label: string; value: number; highlight?: boolean }>;
  height?: number;
  maxValue?: number | null;
  showValues?: boolean;
  style?: React.CSSProperties;
}
export declare function BarChart(props: BarChartProps): JSX.Element;