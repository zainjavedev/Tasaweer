// Configure optional sample entries here.
// Leave arrays empty to hide samples in the UI.

export const photoEditingSamples: string[] = [
  // Example: '/samples/living-room.jpg', '/samples/kitchen.jpg'
];

export interface TextToImageSample {
  prompt: string;
  preview?: string; // optional preview image path in /public
}

export const textToImageSamples: TextToImageSample[] = [
  // Example:
  // { prompt: 'Bright modern kitchen interior, wide angle, natural light', preview: '/samples/kitchen.jpg' },
  // { prompt: 'Luxury living room, staging, photo-realistic, 35mm, sharp' },
];

