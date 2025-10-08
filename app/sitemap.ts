import type { MetadataRoute } from 'next';

const fallbackBase = 'https://tasaweers.com';
const envBase = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const baseUrl = envBase || fallbackBase;

const routes = [
  '/',
  '/photo-editor',
  '/text2image',
  '/try-apparel',
  '/restoration',
  '/replace',
  '/bulk-edit',
  '/youtube-thumbnail-editor',
  '/gemini-watermark-remover',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map((path) => ({
    url: `${baseUrl}${path === '/' ? '/' : path}`,
    lastModified,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.8,
  }));
}
