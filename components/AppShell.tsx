'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Analytics } from '@vercel/analytics/next';
import { getSeoConfig } from '@/lib/seoConfig';

interface AppShellProps {
  baseUrl: string;
  children: ReactNode;
}

export function AppShell({ baseUrl, children }: AppShellProps) {
  const pathname = usePathname() || '/';
  const hideChrome = pathname === '/verify';
  const { structuredData } = getSeoConfig(pathname);
  const structuredEntries = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Tasaweers',
      url: baseUrl,
    },
    ...structuredData({ baseUrl, path: pathname }),
  ];

  return (
    <div className={`${hideChrome ? 'bg-black text-white' : 'bg-white text-black'} flex min-h-screen flex-col font-sans`}>
      {structuredEntries.map((entry, idx) => (
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          key={idx}
          type="application/ld+json"
        />
      ))}
      {!hideChrome && <Header />}
      <main
        className={`container mx-auto flex-1 px-4 py-6 sm:py-8 lg:py-12 ${hideChrome ? 'flex items-center justify-center' : ''}`}
      >
        {children}
      </main>
      {!hideChrome && (
        <footer className="border-t border-black/10 bg-white/70 py-6 text-center text-sm text-black/70">
          <p className="font-semibold text-black">Built with love.</p>
        </footer>
      )}
      <Analytics />
    </div>
  );
}
