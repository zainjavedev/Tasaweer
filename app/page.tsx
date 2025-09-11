'use client';

import React from 'react';
import HomePage from '@/pages/HomePage';
import { useRouter } from 'next/navigation';
import type { Page } from '@/types';

export default function Page() {
  const router = useRouter();
  const goTo = (p: Page) => {
    const map: Record<Page, string> = {
      home: '/',
      text2image: '/text2image',
      'try-apparel': '/try-apparel',
      'photo-editor': '/photo-editor',
    };
    router.push(map[p]);
  };
  return (
    <HomePage goTo={goTo} />
  );
}
