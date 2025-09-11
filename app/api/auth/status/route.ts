import { NextResponse } from 'next/server';
import { isAuthConfigured } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const authRequired = isAuthConfigured();
    return NextResponse.json({ authRequired });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}

