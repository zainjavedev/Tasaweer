"use client";

import React, { useEffect } from 'react';

export default function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="preview" className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        <button onClick={onClose} className="absolute top-2 right-2 px-3 py-1.5 rounded bg-white/90 text-gray-800 border shadow">Close</button>
      </div>
    </div>
  );
}

