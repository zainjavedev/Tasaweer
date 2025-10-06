'use client';

import React, { Suspense } from 'react';
import GeminiWatermarkRemoverPage from '@/pages/GeminiWatermarkRemoverPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <GeminiWatermarkRemoverPage />
    </Suspense>
  );
}

