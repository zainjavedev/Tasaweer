export enum ImageModel {
  IMAGEN = 'imagen-4.0-generate-001',
  NANO_BANANA = 'gemini-2.5-flash-image',
}

export const IMAGE_MODEL_OPTIONS: { value: ImageModel; label: string }[] = [
  { value: ImageModel.NANO_BANANA, label: 'Gemini Flash' },
  { value: ImageModel.IMAGEN, label: 'Imagen 4' },
];

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const IMAGEN_ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: 'Instagram Post (1:1)' },
  { value: '16:9', label: 'YouTube Thumbnail (16:9)' },
  { value: '9:16', label: 'Reels / TikTok (9:16)' },
  { value: '4:3', label: 'Presentation Slide (4:3)' },
  { value: '3:4', label: 'Poster / Print (3:4)' },
];

export const DEFAULT_IMAGEN_ASPECT_RATIO: AspectRatio = '1:1';
