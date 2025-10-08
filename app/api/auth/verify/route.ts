import { NextRequest, NextResponse } from 'next/server';
import { prisma, isPrismaAvailable } from '@/lib/prisma';
import crypto from 'crypto';
import { signToken, setAuthCookieHeaders } from '@/lib/authDb';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!isPrismaAvailable) {
    return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  }
  try {
    const token = req.nextUrl.searchParams.get('token')?.trim() || '';
    if (!token) return NextResponse.json({ error: 'Missing or empty token' }, { status: 400 });
    const now = new Date();
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    if (user.verificationTokenExpires && user.verificationTokenExpires < now) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to verify' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('Verification POST called');
  if (!isPrismaAvailable) {
    return NextResponse.json({ error: 'No database configured' }, { status: 400 });
  }
  try {
    const body = await req.json();
    console.log('Request body:', body);

    const { email, code } = body;
    if (!email || !code) {
      console.log('Missing email or code:', email, code);
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    }

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    console.log('Code:', code, 'hashed as:', codeHash);

    const user = await prisma.user.findFirst({ where: { email, verificationToken: code } });
    if (!user) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });

    const now = new Date();
    if (user.verificationTokenExpires && user.verificationTokenExpires < now) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    }

    // Token is valid; update user verification state (example)
    await prisma.user.update({
      where: { email },
      data: {
        emailVerifiedAt: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    const jwt = signToken({ sub: user.id, username: user.username, role: user.role });
    const headers = setAuthCookieHeaders(jwt);

    return NextResponse.json({ ok: true }, { headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
