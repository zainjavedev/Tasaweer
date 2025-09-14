import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationCodeEmail } from '@/lib/email';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.emailVerifiedAt) return NextResponse.json({ ok: true });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15);
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: codeHash, verificationTokenExpires: expires } });
    await sendVerificationCodeEmail(email, code);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to resend' }, { status: 500 });
  }
}
