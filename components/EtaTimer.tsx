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
    <div
      className="w-full sm:max-w-md mx-auto sm:mx-0 space-y-3 rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm"
      aria-live="polite"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <span>{status}</span>
      </div>
      <div className="text-sm font-semibold text-black tracking-wide">
        ~{remaining}s remaining <span className="text-black/50">(est. {totalSeconds}s)</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-black transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default EtaTimer;
