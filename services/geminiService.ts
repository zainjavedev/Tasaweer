
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { EditedImageResult } from '../types';

const MODEL_NAME = 'gemini-2.5-flash-image-preview';

export const editImageWithNanoBanana = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  additionalImages?: { data: string; mimeType: string }[]
): Promise<EditedImageResult> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key not set. Define NEXT_PUBLIC_GEMINI_API_KEY (or API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const parts: any[] = [
      { inlineData: { data: base64ImageData, mimeType } },
    ];
    if (additionalImages && additionalImages.length > 0) {
      parts.push({ text: 'Reference images to guide the edit:' });
      for (const img of additionalImages) {
        parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
      }
    }
    parts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No response candidates found from the API.");
    }

    const result: EditedImageResult = {
      imageUrl: '',
      text: '',
    };
    
    // The model can return multiple parts (image and text)
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        result.text += part.text;
      } else if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        result.imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    if (!result.imageUrl) {
      throw new Error("API response did not include an image. The model may have refused the request.");
    }

    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};

export const generateImageFromText = async (
  prompt: string
): Promise<EditedImageResult> => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key not set. Define NEXT_PUBLIC_GEMINI_API_KEY (or API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No response candidates found from the API.");
    }

    const result: EditedImageResult = { imageUrl: '', text: '' };
    for (const part of response.candidates[0].content.parts) {
      if ((part as any).text) {
        result.text += (part as any).text;
      } else if ((part as any).inlineData) {
        const base64ImageBytes: string = (part as any).inlineData.data;
        const mime = (part as any).inlineData.mimeType || 'image/png';
        result.imageUrl = `data:${mime};base64,${base64ImageBytes}`;
      }
    }

    if (!result.imageUrl) {
      throw new Error("API response did not include an image. The model may have refused the request.");
    }

    return result;
  } catch (error) {
    console.error("Error generating image from text:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating an image.");
  }
};
