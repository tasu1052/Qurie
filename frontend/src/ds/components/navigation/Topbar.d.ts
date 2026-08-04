/** Top app bar: chevron breadcrumbs, optional search, actions slot, account chip. */
export interface TopbarProps {
  breadcrumbs?: React.ReactNode[];
  searchPlaceholder?: string;
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  actions?: React.ReactNode;
  userName?: string;
  userRole?: string | null;
  searchIcon?: React.ReactNode;
  /** When true, hides the ⌘K search input. */
  hideSearch?: boolean;
  /** Account chip click — typically navigate to my page. */
  onUserClick?: () => void;
  /** Slot before breadcrumbs (e.g. mobile menu button). */
  leading?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Topbar(props: TopbarProps): JSX.Element;
