"use client";

import type { ReactNode } from 'react';
import './globals.css';
import { Header } from '@/components/Header';
import { NavigationNext } from '@/components/NavigationNext';
import { Analytics } from '@vercel/analytics/next';
import { usePathname } from 'next/navigation';
import { getSeoConfig } from '@/lib/seoConfig';

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const hideChrome = pathname === '/verify';
  const fallbackBase = 'https://tasaweers.com';
  const envBase = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const baseUrl = envBase || fallbackBase;
  const canonical = `${baseUrl}${pathname === '/' ? '/' : pathname}`;
  const { title, description, keywords, robots, structuredData } = getSeoConfig(pathname);
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
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        {keywords?.length ? (
          <meta name="keywords" content={keywords.join(', ')} />
        ) : null}
        <meta name="robots" content={robots} />
        <meta name="google-site-verification" content="-w8M2G51cw28VXBQiQmZLRYMvfT9ZCWbWZTsVDfwn0k" />

        {/* Open Graph */}
        <meta property="og:site_name" content="Tasaweers" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        {canonical && <meta property="og:url" content={canonical} />}
        {canonical && <link rel="canonical" href={canonical} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {/* Theme + Manifest */}
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/site.webmanifest" />
        <link
          rel="icon"
          href={`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='%23000000'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-size='34' fill='white'>T</text></svg>`}
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Quicksand', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}</style>
      </head>
      <body
        className={`${hideChrome ? 'bg-black' : 'bg-white'} flex min-h-screen flex-col font-sans text-black`}
      >
        {/* Structured data */}
        {structuredEntries.map((entry, idx) => (
          <script
            key={idx}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          />
        ))}
        {!hideChrome && <Header />}
        {/* {!hideChrome && <NavigationNext />} */}
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
      </body>
    </html>
  );
}
