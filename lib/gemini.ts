// Server-only Gemini client wrapper
import { GoogleGenAI, Modality, type GenerateContentResponse } from '@google/genai';
import { requireEnv } from './env';
import { AspectRatio, DEFAULT_IMAGEN_ASPECT_RATIO, ImageModel } from './imageModels';

const DEFAULT_IMAGE_MODEL = ImageModel.NANO_BANANA;

function client() {
  const apiKey = requireEnv('GEMINI_API_KEY');
  return new GoogleGenAI({ apiKey });
}

const fakeImageResponse = {
  imageUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  text: 'FAKE: image generated (test mode)',
};

export async function optimizePrompt(prompt: string): Promise<string> {
  if (process.env.GEMINI_FAKE === '1') return prompt;

  const ai = client();
  const systemInstruction = `You are an expert in crafting highly detailed and effective prompts for AI image generation models. 
Take the user's input and expand it into a rich, descriptive prompt that includes details about the subject, style, lighting, composition, and mood. 
Do not add any conversational text, just return the optimized prompt.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    config: { systemInstruction },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const optimized = parts
    .map((part) => (part.text ? part.text : ''))
    .join(' ')
    .trim();

  return optimized || prompt;
}

interface GenerateImageParams {
  prompt: string;
  model: ImageModel;
  additionalImages?: { data: string; mimeType: string }[];
  aspectRatio?: AspectRatio;
}

export async function generateImage({
  prompt,
  model,
  additionalImages,
  aspectRatio,
}: GenerateImageParams) {
  if (process.env.GEMINI_FAKE === '1') {
    return fakeImageResponse;
  }

  const ai = client();
  const selectedModel = model ?? DEFAULT_IMAGE_MODEL;

  if (selectedModel === ImageModel.IMAGEN) {
    const response = await ai.models.generateImages({
      model: ImageModel.IMAGEN,
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: (aspectRatio ?? DEFAULT_IMAGEN_ASPECT_RATIO) as AspectRatio,
      },
    });

    const image = response.generatedImages?.[0]?.image?.imageBytes;
    if (!image) throw new Error('Imagen did not return an image');

    return {
      imageUrl: `data:image/png;base64,${image}`,
      text: '',
    };
  }

  const parts: any[] = [];
  if (Array.isArray(additionalImages) && additionalImages.length) {
    parts.push({ text: 'Reference images to guide generation:' });
    for (const img of additionalImages) {
      parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
    }
  }
  parts.push({ text: prompt });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: selectedModel,
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
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
) {
  if (process.env.GEMINI_FAKE === '1') {
    return {
      imageUrl: fakeImageResponse.imageUrl,
      text: 'FAKE: image edited (test mode)',
    };
  }
  const ai = client();
  const parts: any[] = [{ inlineData: { data: base64ImageData, mimeType } }];
  if (Array.isArray(additionalImages) && additionalImages.length) {
    parts.push({ text: 'Reference images to guide the edit:' });
    for (const img of additionalImages) parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
  }
  parts.push({ text: prompt });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: DEFAULT_IMAGE_MODEL,
    contents: { parts },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
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
