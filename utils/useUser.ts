"use client";

import { useState, useEffect, useCallback } from 'react';
import { getToken, authorizedFetch, AUTH_TOKEN_CHANGE_EVENT, hasSessionCookie } from './authClient';
import { setUserLimits, UserLimits, getUserLimits, clearUserLimits } from './userLimits';

export interface UserData {
  username: string | null;
  role: string | null;
  imageCount: number | null;
  imageLimit: number | null;
  effectiveLimit: number | null;
  email?: string | null;
  verified?: boolean;
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      // Attempt to fetch current user regardless of token presence so that
      // cookie-based sessions also work in admin and elsewhere.
      const response = await authorizedFetch('/api/users/me', { redirectOn401: false });
      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          // Clear any cached limits so UI doesn't show logged-in state
          clearUserLimits();
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const userData: UserData = await response.json();

      // Update user state
      setUser(userData);

      // Update local limits storage
      const limits: UserLimits = {
        imageCount: userData.imageCount || 0,
        imageLimit: userData.imageLimit,
        role: userData.role || 'FREE'
      };
      setUserLimits(limits);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUserData = useCallback(() => {
    return fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleAuthChange = () => {
      fetchUserData();
    };
    window.addEventListener(AUTH_TOKEN_CHANGE_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_TOKEN_CHANGE_EVENT, handleAuthChange);
    };
  }, [fetchUserData]);

  // Also load initial data from localStorage if available
  useEffect(() => {
    const storedLimits = getUserLimits();
    // Only hydrate from local storage if we appear to have a session
    const token = getToken();
    const hasSession = !!token || hasSessionCookie();
    if (storedLimits && !user && hasSession) {
      const username = token ? (() => {
        const idx = token.indexOf(':');
        if (idx > 0) return token.slice(0, idx);
        if (token.split('.').length === 3) {
          try {
            const payloadSeg = token.split('.')[1];
            const json = atob(payloadSeg.replace(/-/g, '+').replace(/_/g, '/'));
            const data = JSON.parse(json);
            return data?.username || null;
          } catch {}
        }
        return null;
      })() : null;

      setUser({
        username,
        role: storedLimits.role,
        imageCount: storedLimits.imageCount,
        imageLimit: storedLimits.imageLimit,
        effectiveLimit: storedLimits.imageLimit
      });
    }
  }, [user]);

  return {
    user,
    loading,
    error,
    refreshUserData,
    authorizedFetch
  };
}
