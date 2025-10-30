import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { error: 'Admin features are disabled because authentication has been removed.' },
    { status: 410 }
  );
}
