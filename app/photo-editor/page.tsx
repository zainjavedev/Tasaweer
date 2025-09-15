'use client';

import React, { Suspense } from 'react';
import AuthGate from '@/components/AuthGate';
import PhotoEditorPage from '@/pages/PhotoEditorPage';

export default function Page() {
  return (
    <AuthGate>
      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <PhotoEditorPage />
      </Suspense>
    </AuthGate>
  );
}

