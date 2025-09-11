import { NextRequest, NextResponse } from 'next/server';
import { expectedToken, getStaticCreds } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    const creds = getStaticCreds();
    if (!creds.username || !creds.password) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }

    if (username !== creds.username || password !== creds.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = expectedToken();
    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 500 });
  }
}

