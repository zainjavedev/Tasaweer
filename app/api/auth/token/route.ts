import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('; ').find((c) => c.startsWith('auth_token='))?.split('=')[1];
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 404 });
  return NextResponse.json({ token: decodeURIComponent(token) });
}

