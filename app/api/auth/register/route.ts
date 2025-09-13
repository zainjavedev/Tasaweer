import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/authDb';
import { sendVerificationEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Registration requires a database' }, { status: 400 });
  }
  try {
    const { email, username, password } = await req.json();
    if (!email || !username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (exists) return NextResponse.json({ error: 'Email or username already in use' }, { status: 400 });
    const passwordHash = await hashPassword(password);
    const token = crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).slice(2);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const user = await prisma.user.create({ data: { email, username, passwordHash, verificationToken: token, verificationTokenExpires: expires } });
    const baseUrl = process.env.APP_BASE_URL || `${req.nextUrl.protocol}//${req.headers.get('host')}`;
    const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;
    await sendVerificationEmail(email, verifyUrl);
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Registration failed' }, { status: 500 });
  }
}

