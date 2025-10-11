// Server-only Gemini client wrapper
import { GoogleGenAI, Modality, type GenerateContentResponse } from '@google/genai';
import { requireEnv } from './env';

const MODEL_NAME = 'gemini-2.5-flash-image-preview';

function client() {
  const apiKey = requireEnv('GEMINI_API_KEY');
  return new GoogleGenAI({ apiKey });
}

export async function generateImage(
  prompt: string,
  additionalImages?: { data: string; mimeType: string }[],
  aspectRatio?: string
) {
  if (process.env.GEMINI_FAKE === '1') {
    // 1x1 transparent PNG
    const tinyPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
    ;
    return {
      imageUrl: `data:image/png;base64,${tinyPngBase64}`,
      text: 'FAKE: image generated (test mode)'
    };
  }
  const ai = client();
  const parts: any[] = [];
  if (Array.isArray(additionalImages) && additionalImages.length) {
    parts.push({ text: 'Reference images to guide generation:' });
    for (const img of additionalImages) parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
  }
  parts.push({ text: prompt });

  const config: any = {
    responseModalities: [Modality.IMAGE, Modality.TEXT],
  };

  if (aspectRatio) {
    config.imageConfig = {
      ...(config.imageConfig ?? {}),
      aspectRatio,
    };
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config,
  });

  let imageUrl = '';
  let text = '';
  const rparts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of rparts as any[]) {
    if (part.text) text += part.text;
    if (part.inlineData) {
      const data = part.inlineData.data as string;
      const mt = (part.inlineData.mimeType as string) || 'image/png';
      imageUrl = `data:${mt};base64,${data}`;
    }
  }
  if (!imageUrl) throw new Error('No image returned by model');
  return { imageUrl, text };
}

export async function editImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  additionalImages?: { data: string; mimeType: string }[],
  aspectRatio?: string
) {
  if (process.env.GEMINI_FAKE === '1') {
    // Echo back a tiny PNG to simulate edited output
    const tinyPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
    ;
    return {
      imageUrl: `data:image/png;base64,${tinyPngBase64}`,
      text: 'FAKE: image edited (test mode)'
    };
  }
  const ai = client();
  const parts: any[] = [{ inlineData: { data: base64ImageData, mimeType } }];
  if (Array.isArray(additionalImages) && additionalImages.length) {
    parts.push({ text: 'Reference images to guide the edit:' });
    for (const img of additionalImages) parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
  }
  parts.push({ text: prompt });

  const config: any = {
    responseModalities: [Modality.IMAGE, Modality.TEXT],
  };

  if (aspectRatio) {
    config.imageConfig = {
      ...(config.imageConfig ?? {}),
      aspectRatio,
    };
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config,
  });

  let imageUrl = '';
  let text = '';
  const rparts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of rparts as any[]) {
    if (part.text) text += part.text;
    if (part.inlineData) {
      const data = part.inlineData.data as string;
      const mt = (part.inlineData.mimeType as string) || 'image/png';
      imageUrl = `data:${mt};base64,${data}`;
    }
  }
  if (!imageUrl) throw new Error('No image returned by model');
  return { imageUrl, text };
}
