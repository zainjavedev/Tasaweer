'use client';

import React from 'react';
import AuthGate from '@/components/AuthGate';
import PhotoEditorPage from '@/pages/PhotoEditorPage';

export default function Page() {
  return (
    <AuthGate>
      <PhotoEditorPage />
    </AuthGate>
  );
}

