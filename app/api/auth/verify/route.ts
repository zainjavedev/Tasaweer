import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  }
  try {
    const token = req.nextUrl.searchParams.get('token') || '';
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    const now = new Date();
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    if (user.verificationTokenExpires && user.verificationTokenExpires < now) return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), verificationToken: null, verificationTokenExpires: null } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Verification failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  }
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (!user.verificationToken || !user.verificationTokenExpires) return NextResponse.json({ error: 'No code to verify' }, { status: 400 });
    if (user.verificationTokenExpires < new Date()) return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    const codeHash = crypto.createHash('sha256').update(String(code)).digest('hex');
    if (codeHash !== user.verificationToken) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), verificationToken: null, verificationTokenExpires: null } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Verification failed' }, { status: 500 });
  }
}
