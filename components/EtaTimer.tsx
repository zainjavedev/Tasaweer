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

  const pct = Math.min(100, Math.round((elapsed / seconds) * 100));
  const remaining = Math.max(0, Math.ceil(seconds - elapsed));

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-2">
      <div className="text-xs text-gray-600 dark:text-gray-300">
        {label || `Estimated ${seconds}s · ~${remaining}s remaining`}
      </div>
      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 dark:bg-purple-500 transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default EtaTimer;

