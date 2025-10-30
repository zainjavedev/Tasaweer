import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/gemini';
import { GenerationType } from '@prisma/client';
import { recordAnonymousGeneration } from '@/lib/anonymousUsage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prompt, additionalImages, aspectRatio } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }
    const result = await generateImage(prompt, additionalImages, aspectRatio);
    await recordAnonymousGeneration(GenerationType.TEXT_TO_IMAGE);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
