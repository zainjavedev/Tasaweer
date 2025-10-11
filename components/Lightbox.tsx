"use client";

import React, { useEffect, useMemo } from 'react';

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

  if (!source) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white/90">{headerTitle}</p>
            {description && <div className="text-xs text-white/60">{description}</div>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
              >
                Download
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/25"
              aria-label="Close preview"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-neutral-900/40 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source}
            alt={alt}
            className="mx-auto h-full max-h-[72vh] w-full max-w-full rounded-2xl object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
