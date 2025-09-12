import crypto from 'crypto';
import { NextRequest } from 'next/server';

export type StaticUser = { username: string; password: string };

export function getStaticUsers(): StaticUser[] {
  // Only use AUTH_USERS as JSON array of { username, password }
  const raw = process.env.AUTH_USERS;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr
        .map((u) => ({ username: String(u.username || ''), password: String(u.password || '') }))
        .filter((u) => u.username && u.password);
    }
  } catch {}
  return [];
}

export function computeTokenHash(username: string, password: string) {
  const hash = crypto.createHash('sha256');
  hash.update(`${username}:${password}`);
  return hash.digest('hex');
}

export function makeBearerToken(username: string, password: string) {
  // Encode username so we can recover who is logged in on the client
  const hash = computeTokenHash(username, password);
  return `${username}:${hash}`;
}

export function expectedTokens(): string[] {
  const users = getStaticUsers();
  return users.map((u) => makeBearerToken(u.username, u.password));
}

export function isAuthConfigured(): boolean {
  return getStaticUsers().length > 0;
}

export function verifyApiAuth(req: NextRequest): string | null {
  const users = getStaticUsers();
  // If auth is not configured, allow requests through
  if (users.length === 0) return null;
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : auth.trim();
  if (!token) return 'Unauthorized';

  // Accept either new format "username:hash" or legacy "hash" only
  if (token.includes(':')) {
    const idx = token.indexOf(':');
    const user = token.slice(0, idx);
    const hash = token.slice(idx + 1);
    const match = users.find((u) => u.username === user);
    if (!match) return 'Unauthorized';
    const exp = computeTokenHash(match.username, match.password);
    return hash === exp ? null : 'Unauthorized';
  }

  // Legacy: plain hash matches any user pair
  const validHashes = new Set(users.map((u) => computeTokenHash(u.username, u.password)));
  return validHashes.has(token) ? null : 'Unauthorized';
}
