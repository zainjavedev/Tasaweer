import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json({ error: 'Authentication is disabled. Password management is no longer required.' }, { status: 410 });
}
