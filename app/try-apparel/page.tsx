'use client';

import TryApparelPage from '@/pages/TryApparelPage';
import AuthGate from '@/components/AuthGate';

export default function Page() {
  return (
    <AuthGate>
      <TryApparelPage />
    </AuthGate>
  );
}
