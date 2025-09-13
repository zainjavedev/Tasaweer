import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');
const JWT_ISSUER = process.env.JWT_ISSUER || 'tasaweers';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'web';

export type JwtPayload = { sub: string; username?: string; role?: string };

export async function hashPassword(plain: string) {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string) {
  try { return await bcrypt.compare(plain, hash); } catch { return false; }
}

export async function signToken(payload: JwtPayload, ttlSeconds = 60 * 60 * 24 * 7) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(now + ttlSeconds)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER, audience: JWT_AUDIENCE });
  return payload as JwtPayload & { iat: number; exp: number };
}

export function setAuthCookieHeaders(token: string) {
  const cookieParts = [
    `auth_token=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV === 'production') cookieParts.push('Secure');
  // 7 days
  const maxAge = 60 * 60 * 24 * 7;
  cookieParts.push(`Max-Age=${maxAge}`);
  return new Headers({ 'Set-Cookie': cookieParts.join('; ') });
}

export function clearAuthCookieHeaders() {
  const cookie = `auth_token=; Path=/; Max-Age=0; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}HttpOnly; SameSite=Lax`;
  return new Headers({ 'Set-Cookie': cookie });
}

export function jsonWithCookies(body: any, headers: Headers) {
  return NextResponse.json(body, { headers });
}

