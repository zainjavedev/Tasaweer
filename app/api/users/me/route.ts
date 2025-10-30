import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    username: null,
    role: 'ANONYMOUS',
    imageCount: 0,
    imageLimit: null,
    effectiveLimit: null,
    email: null,
    verified: true,
  });
}
