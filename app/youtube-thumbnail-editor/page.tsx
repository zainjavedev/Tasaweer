'use client';

import React, { Suspense } from 'react';
import YouTubeThumbnailEditorPage from '@/pages/YouTubeThumbnailEditorPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <YouTubeThumbnailEditorPage />
    </Suspense>
  );
}
