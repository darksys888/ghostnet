'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Launch target — today (2026-04-30) + 64 days = 2026-07-03 UTC.
const TARGET_DATE = new Date('2026-07-03T00:00:00Z');

export const TARGET_LABEL = TARGET_DATE.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const compute = (): TimeLeft => {
  const diff = Math.max(0, TARGET_DATE.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

export function Countdown(): ReactNode {
  // Render the static initial value on the server, then rehydrate +
  // tick on the client. Avoids SSR/CSR text mismatch.
  const [t, setT] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setT(compute());
    const id = setInterval(() => {
      setT(compute());
    }, 1000);
    return (): void => {
      clearInterval(id);
    };
  }, []);

  const safe = t ?? { days: 64, hours: 0, minutes: 0, seconds: 0 };

  return (
    <div className="countdown" aria-live="polite">
      <Box num={safe.days} label="days" />
      <Box num={safe.hours} label="hours" />
      <Box num={safe.minutes} label="min" />
      <Box num={safe.seconds} label="sec" />
    </div>
  );
}

function Box({ num, label }: Readonly<{ num: number; label: string }>): ReactNode {
  return (
    <div className="box">
      <span className="num">{num.toString().padStart(2, '0')}</span>
      <span className="lbl">{label}</span>
    </div>
  );
}
