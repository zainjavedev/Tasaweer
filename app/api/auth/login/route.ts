import { NextRequest, NextResponse } from 'next/server';
import { getStaticUsers, makeBearerToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
    }

    const users = getStaticUsers();
    if (users.length === 0) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 500 });
    }

    const match = users.find((u) => u.username === username && u.password === password);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = makeBearerToken(match.username, match.password);
    return NextResponse.json({ token, username: match.username });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Login failed' }, { status: 500 });
  }
}
