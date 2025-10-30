import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/gemini';
import { GenerationType } from '@prisma/client';
import { recordAnonymousGeneration } from '@/lib/anonymousUsage';
import { AspectRatio, ImageModel, IMAGEN_ASPECT_RATIOS, DEFAULT_IMAGEN_ASPECT_RATIO } from '@/lib/imageModels';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prompt, additionalImages, aspectRatio, model: requestedModel } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const modelValues = new Set(Object.values(ImageModel));
    const model: ImageModel = modelValues.has(requestedModel) ? requestedModel : ImageModel.NANO_BANANA;

    let ratio: AspectRatio | undefined;
    if (model === ImageModel.IMAGEN) {
      ratio = IMAGEN_ASPECT_RATIOS.some(({ value }) => value === aspectRatio) ? aspectRatio : DEFAULT_IMAGEN_ASPECT_RATIO;
    }

    const result = await generateImage({ prompt, model, additionalImages, aspectRatio: ratio });
    await recordAnonymousGeneration(GenerationType.TEXT_TO_IMAGE);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
