import { NextResponse } from 'next/server';
import { clearAuthCookieHeaders } from '@/lib/authDb';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json({ ok: true }, { headers: clearAuthCookieHeaders() });
}

