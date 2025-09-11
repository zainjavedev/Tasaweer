'use client';

import React from 'react';
import HomePage from '@/pages/HomePage';
import { useRouter } from 'next/navigation';
import type { Page } from '@/types';
import AuthGate from '@/components/AuthGate';

export default function Page() {
  const router = useRouter();
  const goTo = (p: Page) => {
    const map: Record<Page, string> = {
      home: '/',
      restoration: '/restoration',
      replace: '/replace',
      text2image: '/text2image',
      myimages: '/myimages',
      camera: '/camera',
    };
    router.push(map[p]);
  };
  return (
    <AuthGate>
      <HomePage goTo={goTo} />
    </AuthGate>
  );
}
