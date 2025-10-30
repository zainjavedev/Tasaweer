import { NextRequest, NextResponse } from 'next/server';
import { optimizePrompt } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    const optimizedPrompt = await optimizePrompt(prompt);
    return NextResponse.json({ optimizedPrompt });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Optimization failed' }, { status: 500 });
  }
}
