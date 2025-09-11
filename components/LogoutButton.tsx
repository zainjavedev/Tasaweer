'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const logout = () => {
    try {
      // Clear entire localStorage only on explicit logout
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    } catch {}
    router.replace('/login');
  };
  return (
    <button onClick={logout} className="px-3 py-1.5 rounded bg-white/70 dark:bg-gray-700/70 border text-sm font-semibold hover:bg-white dark:hover:bg-gray-700">
      Logout
    </button>
  );
}

