import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ error: 'Authentication is disabled. Tokens are no longer issued.' }, { status: 410 });
}
