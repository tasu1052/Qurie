/** Sort state for one column; serialises to ?sort=key,dir. */
export interface SortState { key: string; dir: 'asc' | 'desc' }
export interface SortableHeaderProps {
  label: React.ReactNode;
  sortKey: string;
  sort?: SortState | null;
  /** 1-based priority when several columns are sorted. */
  index?: number | null;
  onSort?: (next: SortState | null) => void;
  style?: React.CSSProperties;
}
export declare function SortableHeader(props: SortableHeaderProps): JSX.Element;
