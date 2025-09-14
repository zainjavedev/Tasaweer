import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    if (!process.env.DATABASE_URL) {
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
    if (!user.email || !user.emailVerifiedAt) {
      // Issue a fresh 6-digit code and prompt user to verify
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      const expires = new Date(Date.now() + 1000 * 60 * 15);
      await prisma.user.update({ where: { id: user.id }, data: { verificationToken: codeHash, verificationTokenExpires: expires } });
      if (user.email) {
        await sendVerificationCodeEmail(user.email, code);
      }
      return NextResponse.json(
        { unverified: true, email: user.email, error: 'Email not verified. Enter the code we just sent.' },
        { status: 403 }
      );
    }
    const token = await signToken({ sub: user.id, username: user.username, role: user.role });
    return NextResponse.json(
      { token, username: user.username, role: user.role, imageCount: user.imageCount, imageLimit: user.imageLimit },
      { headers: setAuthCookieHeaders(token) }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 500 });
  }
}
