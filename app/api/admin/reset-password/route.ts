import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'Admin password resets are disabled because authentication has been removed.' },
    { status: 410 }
  );
}
