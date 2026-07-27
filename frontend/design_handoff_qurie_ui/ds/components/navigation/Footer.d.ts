import * as React from 'react';
export interface FooterProps {
  year?: number;
  /** Right-hand note, e.g. "현재 데모 버전". */
  note?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Footer(props: FooterProps): JSX.Element;
