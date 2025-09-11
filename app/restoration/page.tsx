'use client';

import RestorationPage from '@/pages/RestorationPage';
import AuthGate from '@/components/AuthGate';

export default function Page() {
  return (
    <AuthGate>
      <RestorationPage />
    </AuthGate>
  );
}
