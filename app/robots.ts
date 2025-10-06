import type { MetadataRoute } from 'next';

const fallbackBase = 'https://tasaweers.com';
const envBase = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const baseUrl = envBase || fallbackBase;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/photo-editor', '/text2image', '/try-apparel', '/restoration', '/replace', '/bulk-edit', '/gemini-watermark-remover'],
      disallow: ['/admin', '/profile', '/myimages', '/login', '/register', '/verify', '/api'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
