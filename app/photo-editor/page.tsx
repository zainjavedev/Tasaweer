'use client';

import React, { Suspense } from 'react';
import PhotoEditorPage from '@/pages/PhotoEditorPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <PhotoEditorPage />
    </Suspense>
  );
}
