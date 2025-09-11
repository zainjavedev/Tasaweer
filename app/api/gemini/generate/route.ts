import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/gemini';
import { verifyApiAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authErr = verifyApiAuth(req);
    if (authErr) return NextResponse.json({ error: authErr }, { status: 401 });
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const result = await generateImage(prompt);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
