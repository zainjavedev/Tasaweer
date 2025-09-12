'use client';

import React, { useEffect } from 'react';
import AuthGate from '@/components/AuthGate';
import { getUsernameFromToken } from '@/utils/authClient';
import { useRouter } from 'next/navigation';
import BulkEditPage from '@/pages/BulkEditPage';

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const u = getUsernameFromToken();
    if (u !== 'zain') {
      router.replace('/');
    }
  }, [router]);
  return (
    <AuthGate>
      <BulkEditPage />
    </AuthGate>
  );
}

