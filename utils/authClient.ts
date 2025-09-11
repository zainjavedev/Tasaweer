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
  if (!token) {
    window.location.replace('/login');
  }
}
