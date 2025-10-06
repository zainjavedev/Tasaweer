'use client';

import React, { Suspense } from 'react';
import YouTubeThumbnailPage from '@/pages/YouTubeThumbnailPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <YouTubeThumbnailPage />
    </Suspense>
  );
}
