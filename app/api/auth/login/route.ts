import { NextRequest, NextResponse } from 'next/server';
import { getStaticUsers, makeBearerToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { signToken, verifyPassword, setAuthCookieHeaders } from '@/lib/authDb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: 'Missing password' }, { status: 400 });
    }

    // Prefer DB auth when DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      if (!email) {
        return NextResponse.json({ error: 'Missing email' }, { status: 400 });
      }
      const where = { email };
      const user = await prisma.user.findUnique({ where: where as any });
      if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      if (!user.email || !user.emailVerifiedAt) {
        return NextResponse.json({ error: 'Email not verified. Please check your inbox.' }, { status: 403 });
      }
      const token = await signToken({ sub: user.id, username: user.username, role: user.role });
      return NextResponse.json(
        { token, username: user.username, role: user.role, imageCount: user.imageCount, imageLimit: user.imageLimit },
        { headers: setAuthCookieHeaders(token) }
      );
    }

    // Fallback to static env-based auth
    const users = getStaticUsers();
    if (users.length === 0) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }
    const id = username || email; // allow email to act as username in static mode
    const match = users.find((u) => u.username === id && u.password === password);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = makeBearerToken(match.username, match.password);
    return NextResponse.json({ token, username: match.username });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 500 });
  }
}
