/** Clean data table: sortable headers, thin row dividers, hover rows, custom cell renderers.
 * @startingPoint section="Data" subtitle="Sortable data table" viewport="700x320" */
export interface DataTableColumn<T = Record<string, unknown>> {
  key: string;
  label: React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  /** custom cell renderer, e.g. Badge or inline Select */
  render?: (row: T) => React.ReactNode;
}
export interface DataTableProps<T = Record<string, unknown>> {
  columns?: DataTableColumn<T>[];
  rows?: T[];
  rowKey?: string;
  onRowClick?: ((row: T) => void) | null;
  style?: React.CSSProperties;
}
export declare function DataTable<T = Record<string, unknown>>(props: DataTableProps<T>): JSX.Element;
