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

  const logout = async () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    try {
      // Ask server to clear HttpOnly cookie
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    } finally {
      // Clear any client-side token and caches
      try {
        clearToken();
        if (typeof window !== 'undefined') {
          window.localStorage.clear();
        }
      } catch {}
      // Refresh user state first so UI swaps immediately
      await refreshUserData();
      // Navigate to login afterwards
      router.replace('/login');
    }
  };

  return (
    <button onClick={logout} className="px-3 py-1.5 rounded bg-white/70 dark:bg-gray-700/70 border text-sm font-semibold hover:bg-white dark:hover:bg-gray-700">
      Logout
    </button>
  );
}
