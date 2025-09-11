'use client';

import { useEffect } from 'react';
import { ensureAuthedOrRedirect } from '@/utils/authClient';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Check whether auth is required before redirecting to login
    (async () => {
      try {
        const res = await fetch('/api/auth/status');
        const data = await res.json().catch(() => ({ authRequired: true }));
        if (data?.authRequired) ensureAuthedOrRedirect();
      } catch {
        // If status fails, fall back to requiring auth
        ensureAuthedOrRedirect();
      }
    })();
  }, []);
  return <>{children}</>;
}
