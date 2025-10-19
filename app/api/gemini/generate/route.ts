import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/gemini';
import { getAuthenticatedUser } from '@/lib/authDb';
import { prisma, isPrismaAvailable } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (!isPrismaAvailable) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { prompt, additionalImages, aspectRatio } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const isAdmin = user.role === 'ADMIN';

    // Check if user has reached their image limit (only for non-admin users)
    if (!isAdmin && user.imageLimit !== null && user.imageCount >= user.imageLimit) {
      const remaining = user.imageLimit - user.imageCount;
      return NextResponse.json({
        error: `Image generation limit reached. You have generated ${user.imageCount} out of ${user.imageLimit} images.`
      }, { status: 429 });
    }

    // Add watermark note for non-verified users
    if (!isAdmin && !user.verified) {
      const watermarkNote = 'add small tasaweers watermark on this image on bottom right';
      if (typeof prompt === 'string') prompt = `${prompt} ${watermarkNote}`;
    }

    // Generate the image
    const result = await generateImage(prompt, additionalImages, aspectRatio);

    // Create generation record in database
    await prisma.generation.create({
      data: {
        userId: user.id,
        type: 'TEXT_TO_IMAGE'
      }
    });

    // Track usage for all users (admins have unlimited quota but still count generations)
    await prisma.user.update({
      where: { id: user.id },
      data: { imageCount: { increment: 1 } }
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
