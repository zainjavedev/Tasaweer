import { NextRequest, NextResponse } from 'next/server';
import { editImage } from '@/lib/gemini';
import { GenerationType } from '@prisma/client';
import { recordAnonymousGeneration } from '@/lib/anonymousUsage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { base64ImageData, mimeType, prompt, additionalImages } = await req.json();
    if (!base64ImageData || !mimeType || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = await editImage(base64ImageData, mimeType, prompt, additionalImages);
    await recordAnonymousGeneration(GenerationType.PHOTO_EDITOR);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
