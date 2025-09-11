"use client";

import type { ReactNode } from 'react';
import './globals.css';
import { Header } from '@/components/Header';
import { NavigationNext } from '@/components/NavigationNext';
import { Analytics } from '@vercel/analytics/next';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname === '/login';
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/vite.svg" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        `}</style>
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200">
        {!hideChrome && <Header />}
        {!hideChrome && <NavigationNext />}
        <main className={`container mx-auto px-4 py-8 ${hideChrome ? 'min-h-screen flex items-center justify-center' : ''}`}>{children}</main>
        {!hideChrome && (
          <footer className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Powered by Gemini API. Built for Professionals.</p>
          </footer>
        )}
        <Analytics />
      </body>
    </html>
  );
}
