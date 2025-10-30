"use client";

import { useCallback } from 'react';
import { authorizedFetch } from './authClient';

export interface UserData {
  username: string | null;
  role: string | null;
  imageCount: number | null;
  imageLimit: number | null;
  effectiveLimit: number | null;
  email?: string | null;
  verified?: boolean;
}

const ANONYMOUS_USER: UserData = {
  username: null,
  role: 'ANONYMOUS',
  imageCount: null,
  imageLimit: null,
  effectiveLimit: null,
  email: null,
  verified: true
};

export function useUser() {
  const refreshUserData = useCallback(async () => ANONYMOUS_USER, []);

  return {
    user: ANONYMOUS_USER,
    loading: false,
    error: null,
    refreshUserData,
    authorizedFetch
  };
}
