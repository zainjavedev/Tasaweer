'use client';

import MyImagesPage from '@/pages/MyImagesPage';
import AuthGate from '@/components/AuthGate';

export default function Page() {
  return (
    <AuthGate>
      <MyImagesPage />
    </AuthGate>
  );
}
