/** Clean data table: sortable headers, thin row dividers, hover rows, custom cell renderers.
 * @startingPoint section="Data" subtitle="Sortable data table" viewport="700x320" */
export interface DataTableColumn {
  key: string;
  label: React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  /** custom cell renderer, e.g. Badge or inline Select */
  render?: (row: any) => React.ReactNode;
}
export interface DataTableProps {
  columns?: DataTableColumn[];
  rows?: any[];
  rowKey?: string;
  onRowClick?: ((row: any) => void) | null;
  style?: React.CSSProperties;
}
export declare function DataTable(props: DataTableProps): JSX.Element;