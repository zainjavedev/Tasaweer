import React, { useEffect, useRef, useState } from 'react';

interface BeforeAfterProps {
  beforeSrc: string;
  afterSrc: string;
  className?: string;
}

// Simple before/after slider for landing previews
const BeforeAfter: React.FC<BeforeAfterProps> = ({ beforeSrc, afterSrc, className }) => {
  const [pos, setPos] = useState(52); // percentage
  const [nudged, setNudged] = useState(false);
  const userInteracted = useRef(false);
  const MIN = 1;
  const MAX = 99;
  const clamp = (v: number) => Math.max(MIN, Math.min(MAX, v));
  const [ratio, setRatio] = useState<{ w: number; h: number } | null>(null);

  // Gentle auto-nudge animation so users notice the slider
  useEffect(() => {
    if (userInteracted.current) return;
    let frame = 0;
    let cycles = 0;
    const min = 38, max = 62, speed = 0.6; // tunables
    let dir = 1;
    const id = setInterval(() => {
      frame += dir * speed;
      if (frame > (max - 50)) { dir = -1; cycles++; }
      if (frame < (min - 50)) { dir = 1; }
      const next = 50 + frame;
      setPos(clamp(next));
      if (cycles >= 2) { // nudge a couple of times then stop
        setNudged(true);
        clearInterval(id);
      }
    }, 16);
    return () => clearInterval(id);
  }, []);

  const onChange = (v: number) => {
    if (!userInteracted.current) userInteracted.current = true;
    setPos(clamp(v));
  };

  const aspect = ratio ? `${ratio.w} / ${ratio.h}` : undefined;

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border ${className || ''}`}>
      <div className="relative w-full bg-gray-100 dark:bg-gray-900" style={{ aspectRatio: aspect }}>
        <img
          src={beforeSrc}
          alt="before"
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            if (el.naturalWidth && el.naturalHeight) setRatio({ w: el.naturalWidth, h: el.naturalHeight });
          }}
        />
        <div className="absolute inset-0" style={{ width: `${pos}%`, overflow: 'hidden' }}>
          <img src={afterSrc} alt="after" className="w-full h-full object-contain" />
        </div>
        {/* Slider line + handle */}
        <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `calc(${pos}% - 1px)` }}>
          <div className="w-0.5 h-full bg-purple-600" />
          <div className="-ml-2 w-4 h-4 rounded-full bg-white border border-purple-600 shadow" />
          {!userInteracted.current && !nudged && (
            <div className="ml-2 px-2 py-0.5 rounded bg-white/90 dark:bg-gray-800/90 text-[10px] text-gray-700 dark:text-gray-200 animate-pulse">Drag</div>
          )}
        </div>
        {/* Corner badges */}
        <div className="absolute left-3 top-3 text-xs font-semibold bg-white/80 dark:bg-gray-900/70 px-2 py-1 rounded">Original</div>
        <div className="absolute right-3 top-3 text-xs font-semibold bg-purple-600 text-white px-2 py-1 rounded">Generated</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none h-2 bg-transparent cursor-ew-resize mt-2"
        aria-label="Original Generated Slider"
      />
    </div>
  );
};

export default BeforeAfter;
