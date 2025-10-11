import React, { useEffect, useRef, useState } from 'react';

interface EtaTimerProps {
  seconds: number; // estimated seconds
  label?: string; // optional label override
}

// Simple ETA display with a progress bar that fills over the estimated time.
export const EtaTimer: React.FC<EtaTimerProps> = ({ seconds, label }) => {
  const [elapsed, setElapsed] = useState(0);
  const started = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (started.current === null) started.current = performance.now();
      const ms = performance.now() - started.current;
      setElapsed(Math.min(ms / 1000, seconds));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seconds]);

  const totalSeconds = Math.max(1, seconds);
  const pct = Math.min(100, Math.round((elapsed / totalSeconds) * 100));
  const remaining = Math.max(0, Math.ceil(totalSeconds - elapsed));
  const status = label || `Generating preview`;

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-3" aria-live="polite">
      <div className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white"></span>
        <span>{status}</span>
      </div>
      <div className="text-xs font-medium text-black/70 dark:text-white/70">
        ~{remaining}s remaining (est. {totalSeconds}s)
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/20">
        <div
          className="h-full bg-black transition-[width] duration-200 ease-out dark:bg-white"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default EtaTimer;
