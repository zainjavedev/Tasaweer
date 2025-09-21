'use client';

import React, { useId, useMemo } from 'react';

export interface AspectRatioOption {
  label: string;
  value: string; // Width:Height format
  display: string;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  {
    label: 'Square',
    value: '1:1',
    display: '1:1',
  },
  {
    label: 'Landscape',
    value: '16:9',
    display: '16:9',
  },
  {
    label: 'Portrait',
    value: '9:16',
    display: '9:16',
  },
  {
    label: 'Wide',
    value: '2:1',
    display: '2:1',
  },
  {
    label: 'Tall',
    value: '1:2',
    display: '1:2',
  },
  {
    label: 'Wide Landscape',
    value: '21:9',
    display: '21:9',
  },
];

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onSelect: (ratioValue: string) => void;
}

export function AspectRatioSelector({ selectedRatio, onSelect }: AspectRatioSelectorProps) {
  const selectId = useId();
  const previewStyle = useMemo(() => {
    const [w, h] = selectedRatio.split(':').map(Number);
    const width = 44;
    if (!w || !h) {
      return { width, height: width } as React.CSSProperties;
    }
    const height = Math.min(32, Math.max(14, Math.round((h / w) * width)));
    return { width, height } as React.CSSProperties;
  }, [selectedRatio]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-black">Aspect ratio</label>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <select
            id={selectId}
            value={selectedRatio}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full appearance-none rounded border border-black/20 bg-white px-3 py-1.5 pr-8 text-sm text-black focus:border-black/40 focus:outline-none focus:ring-2 focus:ring-black/15"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {`${ratio.label} (${ratio.display})`}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-black/50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.584l3.71-3.354a.75.75 0 111.04 1.08l-4.23 3.823a.75.75 0 01-1.04 0L5.21 8.31a.75.75 0 01.02-1.1z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-black/60">
          <span>Preview</span>
          <div className="rounded border border-black/30 bg-black/10 transition-all duration-300 ease-in-out" style={previewStyle} />
        </div>
      </div>
    </div>
  );
}

export function getAspectRatioDimensions(ratio: string, basePixels = 1024): { width: number; height: number } {
  const [widthRatio, heightRatio] = ratio.split(':').map(Number);

  // For square and simple ratios, keep it straightforward
  if (ratio === '1:1') {
    return { width: basePixels, height: basePixels };
  }

  // For other ratios, scale to maintain aspect while keeping reasonable dimensions
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(widthRatio, heightRatio);

  const simplifiedWidth = widthRatio / divisor;
  const simplifiedHeight = heightRatio / divisor;

  // Normalize to fit within reasonable pixel limits
  const scaleFactor = basePixels / Math.max(simplifiedWidth, simplifiedHeight);
  const width = Math.round(simplifiedWidth * scaleFactor);
  const height = Math.round(simplifiedHeight * scaleFactor);

  return { width, height };
}
