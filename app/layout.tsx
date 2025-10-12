import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import meta from '@/metadata.json';
import { AppShell } from '@/components/AppShell';
import { resolveBaseUrl } from '@/lib/seoMetadata';

const ICON_DATA_URL =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='%23000000'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-size='34' fill='white'>T</text></svg>";

const baseUrlForMetadata = resolveBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrlForMetadata),
  title: 'Tasaweers | AI Photo Editing Suite',
  description: meta.description,
  themeColor: '#000000',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      {
        url: ICON_DATA_URL,
        type: 'image/svg+xml',
      },
    ],
  },
  verification: {
    google: '-w8M2G51cw28VXBQiQmZLRYMvfT9ZCWbWZTsVDfwn0k',
  },
  openGraph: {
    siteName: 'Tasaweers',
    type: 'website',
    url: baseUrlForMetadata,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const baseUrl = resolveBaseUrl();

  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Quicksand', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            margin: 0;
          }
        `}</style>
      </head>
      <body>
        <AppShell baseUrl={baseUrl}>{children}</AppShell>
      </body>
    </html>
  );
}
