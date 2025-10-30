'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Lightbox from './Lightbox';

interface ImageRequest {
  url: string;
  title?: string;
  alt?: string;
  downloadFileName?: string;
  onDownload?: () => void;
}

interface ImageViewerContextValue {
  openImage(request: ImageRequest): void;
  closeImage(): void;
}

const ImageViewerContext = createContext<ImageViewerContextValue | null>(null);

export function useImageViewer() {
  const ctx = useContext(ImageViewerContext);
  if (!ctx) {
    throw new Error('useImageViewer must be used inside an ImageViewerProvider');
  }
  return ctx;
}

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ImageRequest | null>(null);

  const closeImage = useCallback(() => {
    setCurrent(null);
  }, []);

  const openImage = useCallback((request: ImageRequest) => {
    setCurrent(request);
  }, []);

  const handleDownload = useCallback(() => {
    if (!current) return;
    if (current.onDownload) {
      current.onDownload();
      return;
    }
    if (current.downloadFileName) {
      try {
        const a = document.createElement('a');
        a.href = current.url;
        a.download = current.downloadFileName;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {}
    }
  }, [current]);

  const value = useMemo(
    () => ({
      openImage,
      closeImage,
    }),
    [openImage, closeImage]
  );

  return (
    <ImageViewerContext.Provider value={value}>
      {children}
      <Lightbox
        imageUrl={current?.url ?? null}
        onClose={closeImage}
        title={current?.title}
        alt={current?.alt}
        onDownload={
          current && (current.onDownload || current.downloadFileName) ? handleDownload : undefined
        }
      />
    </ImageViewerContext.Provider>
  );
}
