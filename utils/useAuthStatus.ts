'use client';

import { useCallback, useEffect, useState } from 'react';
import { getToken, hasSessionCookie } from './authClient';

function readAuthPresence(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(getToken() || hasSessionCookie());
}

export function useAuthStatus(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => readAuthPresence());

  const syncAuthState = useCallback(() => {
    setIsAuthenticated(readAuthPresence());
  }, []);

  useEffect(() => {
    syncAuthState();
  }, [syncAuthState]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'authToken') {
        syncAuthState();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, [syncAuthState]);

  return isAuthenticated;
}
