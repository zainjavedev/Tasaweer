import { NextRequest, NextResponse } from 'next/server';
import { prisma, isPrismaAvailable } from '@/lib/prisma';
import { hashPassword } from '@/lib/authDb';
import { sendVerificationCodeEmail } from '@/lib/email';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!isPrismaAvailable) {
    return NextResponse.json({ error: 'Registration requires a database' }, { status: 400 });
  }
  try {
    const { email, username, password } = await req.json();
    if (!email || !username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (exists) return NextResponse.json({ error: 'Email or username already in use' }, { status: 400 });
    const passwordHash = await hashPassword(password);
    // Get default image limit from environment variables
    const defaultImageLimit = Number(process.env.DEFAULT_USER_IMAGE_LIMIT) || 20;

    // Generate a 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        imageLimit: defaultImageLimit,
        imageCount: 0,
        verificationToken: codeHash,
        verificationTokenExpires: expires
      }
    });
    await sendVerificationCodeEmail(email, code);
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Registration failed' }, { status: 500 });
  }
}
