import { NextRequest, NextResponse } from 'next/server';
import { prisma, isPrismaAvailable } from '@/lib/prisma';
import { signToken, verifyPassword, setAuthCookieHeaders } from '@/lib/authDb';
import { sendVerificationCodeEmail } from '@/lib/email';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: 'Missing password' }, { status: 400 });
    }

    // Database mode only
    if (!isPrismaAvailable) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    if (!email && !username) {
      return NextResponse.json({ error: 'Provide email or username' }, { status: 400 });
    }
    const where = email ? { email } : { username };
    const user = await prisma.user.findUnique({ where: where as any });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    // Allow login regardless of verification; users can verify later in Settings
    const token = await signToken({ sub: user.id, username: user.username, role: user.role });
    return NextResponse.json(
      {
        token,
        username: user.username,
        role: user.role,
        imageCount: user.imageCount,
        imageLimit: user.imageLimit,
        email: user.email,
        verified: Boolean(user.emailVerifiedAt),
      },
      { headers: setAuthCookieHeaders(token) }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 500 });
  }
}
