// Server-only Gemini client wrapper
import { GoogleGenAI, Modality, type GenerateContentResponse } from '@google/genai';
import { requireEnv } from './env';

const MODEL_NAME = 'gemini-2.5-flash-image-preview';

function client() {
  const apiKey = requireEnv('GEMINI_API_KEY');
  return new GoogleGenAI({ apiKey });
}

export async function generateImage(prompt: string) {
  const ai = client();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: [{ text: prompt }] },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
  });

  let imageUrl = '';
  let text = '';
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts as any[]) {
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
  additionalImages?: { data: string; mimeType: string }[]
) {
  const ai = client();
  const parts: any[] = [{ inlineData: { data: base64ImageData, mimeType } }];
  if (Array.isArray(additionalImages) && additionalImages.length) {
    parts.push({ text: 'Reference images to guide the edit:' });
    for (const img of additionalImages) parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
  }
  parts.push({ text: prompt });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
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

