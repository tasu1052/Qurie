/** Top app bar: chevron breadcrumbs, ⌘K search, actions slot, account chip. */
export interface TopbarProps {
  breadcrumbs?: React.ReactNode[];
  searchPlaceholder?: string;
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  actions?: React.ReactNode;
  userName?: string;
  userRole?: string | null;
  searchIcon?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Topbar(props: TopbarProps): JSX.Element;