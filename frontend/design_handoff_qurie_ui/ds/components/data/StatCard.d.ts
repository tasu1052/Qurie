import * as React from 'react';
export interface StatCardProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  /** Signed numeric change only ("+2.1%", "-3"). Status words (LIVE, PENDING…) go in caption. */
  delta?: string | null;
  /** Optional override; derived from the delta sign when omitted. up = green ↑, down = red ↓. */
  deltaDirection?: 'up' | 'down' | null;
  caption?: React.ReactNode;
  accent?: boolean;
  style?: React.CSSProperties;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
