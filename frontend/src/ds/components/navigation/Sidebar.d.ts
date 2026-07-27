/** Persistent left navigation: icon+label items, active indigo tint, collapsible to icons.
 * @startingPoint section="Navigation" subtitle="Collapsible app sidebar" viewport="240x480" */
export interface SidebarItem { key: string; label: React.ReactNode; icon?: React.ReactNode; badge?: React.ReactNode; }
export interface SidebarProps {
  items?: SidebarItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  collapsed?: boolean;
  /** Account/profile slot — pinned to the bottom of the viewport by Sidebar. Required on app shells. */
  footer?: React.ReactNode;
  /** path to assets/logo.png; falls back to type-set Q>rie wordmark */
  logoSrc?: string | null;
  brand?: string;
  style?: React.CSSProperties;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;