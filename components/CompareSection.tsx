"use client";

import React from 'react';
import { useImageViewer } from './ImageViewerProvider';

type Props = {
  originalSrc?: string | null;
  latestSrc?: string | null;
  className?: string;
  title?: string;
};

// Side-by-side comparison (Original vs Latest)
// Responsive: stacks on small screens, two columns on md+
const CompareSection: React.FC<Props> = ({ originalSrc, latestSrc, className, title }) => {
  const { openImage } = useImageViewer();
  if (!originalSrc || !latestSrc) return null;

  return (
    <section className={className || ''}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-black">{title || 'Comparison'}</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() =>
            openImage({
              url: originalSrc,
              title: 'Original preview',
              alt: 'Original image',
            })
          }
          className="group relative overflow-hidden rounded-xl border border-black/12 bg-white/85 p-2"
          aria-label="View original image"
        >
          <div className="absolute left-3 top-3 z-10 rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-black">Original</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={originalSrc} alt="Original" className="h-64 w-full object-contain md:h-72 lg:h-80" />
        </button>

        <button
          type="button"
          onClick={() =>
            openImage({
              url: latestSrc,
              title: 'Latest preview',
              alt: 'Latest image',
            })
          }
          className="group relative overflow-hidden rounded-xl border border-black/12 bg-white/85 p-2"
          aria-label="View latest image"
        >
          <div className="absolute right-3 top-3 z-10 rounded bg-black px-2 py-0.5 text-xs font-semibold text-white">Latest</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={latestSrc} alt="Latest" className="h-64 w-full object-contain md:h-72 lg:h-80" />
        </button>
      </div>
    </section>
  );
};

export default CompareSection;
