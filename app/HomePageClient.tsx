'use client';

import HomePage from '@/pages/HomePage';
import type { Page } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toolPages } from '@/lib/tools';

const routeMap: Record<Page, string> = {
  home: '/',
  text2image: '/text2image',
  'try-apparel': '/try-apparel',
  'photo-editor': '/photo-editor',
  'youtube-thumbnail-editor': '/youtube-thumbnail-editor',
  restoration: '/restoration',
  replace: '/replace',
  'bulk-edit': '/bulk-edit',
  'watermark-remover': '/gemini-watermark-remover',
};

export default function HomePageClient() {
  const router = useRouter();

  const goTo = (page: Page) => {
    router.push(routeMap[page]);
  };

  // Prefetch tool pages to make navigation feel instant from the homepage
  useEffect(() => {
    try {
      toolPages.forEach((t) => router.prefetch?.(t.href));
    } catch {}
  }, [router]);

  return <HomePage goTo={goTo} />;
}
