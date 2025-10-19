"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  imageUrl?: string | null;
  url?: string | null;
  alt?: string;
  title?: string;
  description?: React.ReactNode;
  onClose: () => void;
  onDownload?: () => void;
  actions?: React.ReactNode;
}

const Lightbox: React.FC<LightboxProps> = ({
  imageUrl,
  url,
  alt = 'Preview',
  title,
  description,
  onClose,
  onDownload,
  actions,
}) => {
  const source = imageUrl ?? url ?? null;

  useEffect(() => {
    if (!source) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, source]);

  const headerTitle = useMemo(() => title ?? 'Image preview', [title]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // If no image, we still run hooks above to keep hook order stable
  if (!source) return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[10002] bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="relative grid h-full w-full place-items-center p-2 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="relative max-w-[88vw] sm:max-w-[78vw] md:max-w-[66vw] lg:max-w-[58vw] xl:max-w-[52vw] max-h-[78vh] sm:max-h-[72vh] md:max-h-[66vh] lg:max-h-[62vh] xl:max-h-[60vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source}
            alt={alt}
            className="w-auto h-auto object-contain rounded-xl shadow-2xl max-w-[88vw] sm:max-w-[78vw] md:max-w-[66vw] lg:max-w-[58vw] xl:max-w-[52vw] max-h-[78vh] sm:max-h-[72vh] md:max-h-[66vh] lg:max-h-[62vh] xl:max-h-[60vh]"
          />
          {/* Top overlay with title/actions (YouTube-like) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 sm:p-3">
            <div className="hidden sm:flex flex-col gap-1 pointer-events-auto bg-black/30 rounded-md px-2 py-1">
              <p className="text-white text-sm font-semibold leading-tight line-clamp-1">{headerTitle}</p>
              {description && <div className="text-white/80 text-xs leading-tight">{description}</div>}
            </div>
            <div className="ml-auto flex items-center gap-2 pointer-events-auto">
              {actions}
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/25"
                >
                  Download
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/30"
                aria-label="Close preview"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return mounted && typeof document !== 'undefined' ? createPortal(overlay, document.body) : null;
};

export default Lightbox;
