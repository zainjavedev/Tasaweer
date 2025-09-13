import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.emailVerifiedAt) return NextResponse.json({ ok: true });
    const token = crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).slice(2);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: token, verificationTokenExpires: expires } });
    const baseUrl = process.env.APP_BASE_URL || `${req.nextUrl.protocol}//${req.headers.get('host')}`;
    const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;
    await sendVerificationEmail(email, verifyUrl);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to resend' }, { status: 500 });
  }
}

