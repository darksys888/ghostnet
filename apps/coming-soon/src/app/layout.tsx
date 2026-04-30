import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'GHOSTNET — coming soon',
  description: 'GHOSTNET launches in 64 days.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
