import { EditedImageResult } from '../types';
import { authorizedFetch } from '@/utils/authClient';

// Client-side wrapper that calls server route handlers.
export const editImageWithNanoBanana = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  additionalImages?: { data: string; mimeType: string }[],
  aspectRatio?: string
): Promise<EditedImageResult> => {
  const res = await authorizedFetch('/api/gemini/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64ImageData, mimeType, prompt, additionalImages, aspectRatio }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Edit failed (${res.status})`);
  }
  return res.json();
};

export const generateImageFromText = async (
  prompt: string,
  additionalImages?: { data: string; mimeType: string }[],
  aspectRatio?: string
): Promise<EditedImageResult> => {
  const res = await authorizedFetch('/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, additionalImages, aspectRatio }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || `Generate failed (${res.status})`);
  }
  return res.json();
};
