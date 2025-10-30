import { EditedImageResult } from '../types';
import { authorizedFetch } from '@/utils/authClient';
import { AspectRatio, ImageModel } from '@/lib/imageModels';

// Client-side wrapper that calls server route handlers.
export const editImageWithNanoBanana = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  additionalImages?: { data: string; mimeType: string }[]
): Promise<EditedImageResult> => {
  const res = await authorizedFetch('/api/gemini/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64ImageData, mimeType, prompt, additionalImages }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Edit failed (${res.status})`);
  }
  return res.json();
};

interface GenerateImageOptions {
  prompt: string;
  model: ImageModel;
  additionalImages?: { data: string; mimeType: string }[];
  aspectRatio?: AspectRatio;
}

export const generateImageFromText = async ({
  prompt,
  model,
  additionalImages,
  aspectRatio,
}: GenerateImageOptions): Promise<EditedImageResult> => {
  const res = await authorizedFetch('/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, additionalImages, aspectRatio }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Generate failed (${res.status})`);
  }
  return res.json();
};

export const optimizePrompt = async (prompt: string): Promise<string> => {
  const res = await authorizedFetch('/api/gemini/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Optimize failed (${res.status})`);
  }
  const data = await res.json();
  return typeof data.optimizedPrompt === 'string' ? data.optimizedPrompt : prompt;
};
