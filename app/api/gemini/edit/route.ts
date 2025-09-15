import { NextRequest, NextResponse } from 'next/server';
import { editImage } from '@/lib/gemini';
import { getAuthenticatedUser } from '@/lib/authDb';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { base64ImageData, mimeType, prompt, additionalImages } = await req.json();
    if (!base64ImageData || !mimeType || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user has reached their image limit (only for non-admin users)
    if (user.imageLimit !== null && user.imageCount >= user.imageLimit) {
      return NextResponse.json({
        error: `Image generation limit reached. You have generated ${user.imageCount} out of ${user.imageLimit} images.`
      }, { status: 429 });
    }

    // Edit the image
    const result = await editImage(base64ImageData, mimeType, prompt, additionalImages);

    // Increment the user's image count in the database (only for non-admin users)
    if (user.imageLimit !== null) {
      await prisma.user.update({
        where: { id: user.id },
        data: { imageCount: { increment: 1 } }
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
