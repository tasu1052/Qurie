import * as React from 'react';
export interface FooterProps {
  year?: number;
  /** Optional right-hand note appended after "© {year} Qurie". */
  note?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Footer(props: FooterProps): JSX.Element;
