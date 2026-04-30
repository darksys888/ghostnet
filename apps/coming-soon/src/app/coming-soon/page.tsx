import { Countdown, TARGET_LABEL } from './countdown';

import type { ReactNode } from 'react';

export default function ComingSoonPage(): ReactNode {
  return (
    <main>
      <h1 className="brand">GHOSTNET</h1>
      <p className="tagline">Coming soon</p>
      <Countdown />
      <p className="footer">Launching {TARGET_LABEL} — 64 days from announcement.</p>
    </main>
  );
}
