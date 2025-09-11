'use client';

import ObjectReplacementPage from '@/pages/ObjectReplacementPage';
import AuthGate from '@/components/AuthGate';

export default function Page() {
  return (
    <AuthGate>
      <ObjectReplacementPage />
    </AuthGate>
  );
}
