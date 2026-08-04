import type { ReactNode } from 'react';
import { Footer } from '../../ds';

export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 'var(--content-max)',
        marginInline: 'auto',
        padding: 'var(--content-pad)',
        minWidth: 0,
        minHeight: 0,
        overflowY: 'auto',
        scrollbarGutter: 'stable',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        boxSizing: 'border-box',
      }}
    >
      {children}
      <Footer />
    </main>
  );
}
