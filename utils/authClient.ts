'use client';

/**
 * The application no longer uses authentication. These helpers now exist solely
 * to keep the rest of the codebase simple while providing no-op behaviour.
 */

export function getToken(): string | null {
  return null;
}

export function setToken(): void {
  // No-op – tokens are not used any more.
}

export function clearToken(): void {
  // No-op – tokens are not used any more.
}

export function hasSessionCookie(): boolean {
  return false;
}

type AuthorizedFetchInit = RequestInit & { redirectOn401?: boolean };

export async function authorizedFetch(
  input: RequestInfo | URL,
  init: AuthorizedFetchInit = {}
) {
  // Simply forward to fetch; we keep the signature so existing call sites work.
  const { redirectOn401: _ignored, ...requestInit } = init;
  return fetch(input, requestInit);
}

export function ensureAuthedOrRedirect(): void {
  // No authentication required, so no redirect necessary.
}

export function getUsernameFromToken(): string | null {
  return null;
}
