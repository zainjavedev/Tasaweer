'use client';

import TextToImagePage from '@/pages/TextToImagePage';
import AuthGate from '@/components/AuthGate';

export default function Page() {
  return (
    <AuthGate>
      <TextToImagePage />
    </AuthGate>
  );
}
