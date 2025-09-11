import crypto from 'crypto';
import { NextRequest } from 'next/server';

export function getStaticCreds() {
  const username = process.env.AUTH_USERNAME || '';
  const password = process.env.AUTH_PASSWORD || '';
  return { username, password };
}

export function computeToken(username: string, password: string) {
  const hash = crypto.createHash('sha256');
  hash.update(`${username}:${password}`);
  return hash.digest('hex');
}

export function expectedToken() {
  const { username, password } = getStaticCreds();
  if (!username || !password) return null;
  return computeToken(username, password);
}

export function isAuthConfigured(): boolean {
  const { username, password } = getStaticCreds();
  return Boolean(username && password);
}

export function verifyApiAuth(req: NextRequest): string | null {
  const exp = expectedToken();
  // If auth is not configured, allow requests through instead of failing.
  if (!exp) return null;
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : auth.trim();
  if (!token || token !== exp) return 'Unauthorized';
  return null;
}
