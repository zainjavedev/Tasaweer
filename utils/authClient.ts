'use client';

const TOKEN_KEY = 'authToken';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(t: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, t);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('auth_token='));
}

export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401) {
    // Unauthorized: redirect to login, do not clear localStorage except token may remain
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  return res;
}

export function ensureAuthedOrRedirect() {
  if (typeof window === 'undefined') return;
  const token = getToken();
  if (token) return;
  try {
    fetch('/api/users/me', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) window.location.replace('/login');
      })
      .catch(() => window.location.replace('/login'));
  } catch {
    window.location.replace('/login');
  }
}

export function getUsernameFromToken(): string | null {
  const token = getToken();
  if (!token) return null;
  // Env-based format: username:hash
  const idx = token.indexOf(':');
  if (idx > 0) return token.slice(0, idx);
  // JWT format: header.payload.signature
  if (token.split('.').length === 3) {
    try {
      const payloadSeg = token.split('.')[1];
      const json = atob(payloadSeg.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(json);
      return data?.username || null;
    } catch {}
  }
  return null;
}
