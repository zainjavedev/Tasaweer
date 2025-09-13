import { NextResponse } from 'next/server';
// Database mode only

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Always require auth in DB mode
    return NextResponse.json({ authRequired: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
