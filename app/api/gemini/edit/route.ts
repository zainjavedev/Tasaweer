import { NextRequest, NextResponse } from 'next/server';
import { editImage } from '@/lib/gemini';
import { verifyApiAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authErr = verifyApiAuth(req);
    if (authErr) return NextResponse.json({ error: authErr }, { status: 401 });
    const { base64ImageData, mimeType, prompt, additionalImages } = await req.json();
    if (!base64ImageData || !mimeType || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await editImage(base64ImageData, mimeType, prompt, additionalImages);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
