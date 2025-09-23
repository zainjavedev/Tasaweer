"use client";

import type { ReactNode } from 'react';
import './globals.css';
import { Header } from '@/components/Header';
import { NavigationNext } from '@/components/NavigationNext';
import { Analytics } from '@vercel/analytics/next';
import { usePathname } from 'next/navigation';
import meta from '../metadata.json';

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname === '/login' || pathname === '/register' || pathname === '/verify';
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Tasaweers</title>
        <meta name="description" content={meta.description} />
        <meta name="google-site-verification" content="-w8M2G51cw28VXBQiQmZLRYMvfT9ZCWbWZTsVDfwn0k" />
        <meta name="robots" content="index,follow" />

        {/* Open Graph */}
        <meta property="og:site_name" content="Tasaweers" />
        <meta property="og:title" content="Tasaweers" />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
        {(() => {
          const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
          const href = base ? `${base}${pathname}` : undefined;
          return (
            <>
              {href && <meta property="og:url" content={href} />}
              {href && <link rel="canonical" href={href} />}
            </>
          );
        })()}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tasaweers" />
        <meta name="twitter:description" content={meta.description} />

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
      <body className={`${hideChrome ? 'bg-black' : 'bg-white'} font-sans text-black`}>
        {/* Organization JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Tasaweers',
              url: (process.env.NEXT_PUBLIC_BASE_URL || undefined),
            }),
          }}
        />
        {!hideChrome && <Header />}
        {/* {!hideChrome && <NavigationNext />} */}
        <main
          className={`container mx-auto px-4 py-6 sm:py-8 lg:py-12 ${hideChrome ? 'min-h-screen flex items-center justify-center' : ''}`}
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
