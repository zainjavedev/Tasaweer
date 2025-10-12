'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthGate from '@/components/AuthGate';
import BulkEditPage from '@/pages/BulkEditPage';
import { getUsernameFromToken } from '@/utils/authClient';

export default function BulkEditClient() {
  const router = useRouter();

  useEffect(() => {
    const username = getUsernameFromToken();
    if (username !== 'zain') {
      router.replace('/');
    }
  }, [router]);

  return (
    <AuthGate>
      <BulkEditPage />
    </AuthGate>
  );
}
