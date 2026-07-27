/** Page controls for any paged list. Mirrors the API's page/size params. */
export interface PaginationProps {
  page?: number;
  pageCount?: number;
  pageSize?: number;
  /** "13–24 / 128명" — always state the total. */
  rangeLabel?: React.ReactNode;
  onPage?: (page: number) => void;
  onPageSize?: (size: number) => void;
}
export declare function Pagination(props: PaginationProps): JSX.Element;
export interface LoadMoreProps { label: React.ReactNode; loading?: boolean; onClick?: () => void }
export declare function LoadMore(props: LoadMoreProps): JSX.Element;
