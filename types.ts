import React from 'react';

export type Page =
  | 'home'
  | 'text2image'
  | 'try-apparel'
  | 'photo-editor'
  | 'youtube-thumbnail'
  | 'restoration'
  | 'replace'
  | 'bulk-edit';

export interface PromptTemplate {
  label: string;
  prompt: string;
}

// Legacy types removed for simplified app pages

export interface EditedImageResult {
  imageUrl: string;
  text: string;
}

export interface SelectionBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type GeneratedKind = 'restoration' | 'replace' | 'text2image' | 'camera' | 'edit';

export interface UserImage {
  id: string;
  createdAt: number;
  kind: GeneratedKind;
  prompt?: string;
  original?: string; // data URL
  generated: string; // data URL
  meta?: Record<string, unknown>;
}
