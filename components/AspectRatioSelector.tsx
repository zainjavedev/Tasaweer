'use client';

import React from 'react';

export interface AspectRatio {
  label: string;
  value: string; // Width:Height format
  display: string;
  icon: JSX.Element;
}

const ASPECT_RATIOS: AspectRatio[] = [
  {
    label: 'Square',
    value: '1:1',
    display: '1:1',
    icon: (
      <div className="w-8 h-8 border-2 border-black bg-white m-1">
        <div className="w-full h-full bg-black/10"></div>
      </div>
    ),
  },
  {
    label: 'Landscape',
    value: '16:9',
    display: '16:9',
    icon: (
      <div className="w-10 h-6 border-2 border-black bg-white m-1">
        <div className="w-full h-full bg-black/10"></div>
      </div>
    ),
  },
  {
    label: 'Portrait',
    value: '9:16',
    display: '9:16',
    icon: (
      <div className="w-6 h-10 border-2 border-black bg-white m-1">
        <div className="w-full h-full bg-black/10"></div>
      </div>
    ),
  },
  {
    label: 'Wide',
    value: '2:1',
    display: '2:1',
    icon: (
      <div className="w-12 h-6 border-2 border-black bg-white m-0.5">
        <div className="w-full h-full bg-black/10"></div>
      </div>
    ),
  },
  {
    label: 'Tall',
    value: '1:2',
    display: '1:2',
    icon: (
      <div className="w-6 h-12 border-2 border-black bg-white m-0.5">
        <div className="w-full h-full bg-black/10"></div>
      </div>
    ),
  },
  {
    label: 'Wide Landscape',
    value: '21:9',
    display: '21:9',
    icon: (
      <div className="w-14 h-6 border-2 border-black bg-white m-1">
        <div className="w-full h-full bg-black/10"></div>
      </div>
    ),
  },
];

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onSelect: (ratio: AspectRatio) => void;
}

export function AspectRatioSelector({ selectedRatio, onSelect }: AspectRatioSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-black">Aspect ratio</div>
      <div className="flex flex-wrap gap-3">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => onSelect(ratio)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
              selectedRatio === ratio.value
                ? 'border-black bg-black/10'
                : 'border-gray-300 bg-white hover:border-black'
            }`}
          >
            {ratio.icon}
            <div className={`text-xs font-medium ${
              selectedRatio === ratio.value ? 'text-black' : 'text-black/70'
            }`}>
              {ratio.display}
            </div>
          </button>
        ))}
      </div>
      <div className="text-xs text-black/60">
        Select the aspect ratio for your generated image. Hover over each option to see the visual preview.
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