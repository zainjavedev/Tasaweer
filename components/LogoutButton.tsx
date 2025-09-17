'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clearToken } from '@/utils/authClient';
import { useUser } from '@/utils/useUser';

export default function LogoutButton() {
  const router = useRouter();
  const { refreshUserData } = useUser();
  const isNavigating = useRef(false);

  // Prefetch login for snappier navigation
  useEffect(() => {
    try {
      // @ts-ignore - prefetch exists on app router
      router.prefetch?.('/login');
    } catch {}
  }, [router]);

  const logout = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    // First navigate to login to avoid visible UI flicker
    router.push('/login');
    // Then clear auth and storage on the next tick
    setTimeout(() => {
      try {
        clearToken();
        if (typeof window !== 'undefined') {
          window.localStorage.clear();
          document.cookie.split(';').forEach((c) => {
            document.cookie = c
              .replace(/^\s+/, '')
              .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
          });
        }
      } catch {}
      refreshUserData();
    }, 0);
  };

  return (
    <button onClick={logout} className="px-3 py-1.5 rounded bg-white/70 dark:bg-gray-700/70 border text-sm font-semibold hover:bg-white dark:hover:bg-gray-700">
      Logout
    </button>
  );
}
