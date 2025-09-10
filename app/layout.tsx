import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Header } from '@/components/Header';
import { NavigationNext } from '@/components/NavigationNext';

export const metadata: Metadata = {
  title: 'Tasaweer',
  description: 'AI visual editor for real estate, products, and more',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/vite.svg" />
        {/* Tailwind via CDN for parity with Vite setup */}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        `}</style>
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200">
        <Header />
        <NavigationNext />
        <main className="container mx-auto px-4 py-8">{children}</main>
        <footer className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Gemini API. Built for Professionals.</p>
        </footer>
      </body>
    </html>
  );
}
