'use client';

import { useEffect } from 'react';
import { ensureAuthedOrRedirect } from '@/utils/authClient';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureAuthedOrRedirect();
  }, []);
  return <>{children}</>;
}

