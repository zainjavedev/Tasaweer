'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  MenuIcon,
  XIcon,
  MagicWandIcon,
} from './Icon';
import { toolPages } from '@/lib/tools';
import { Fredoka } from 'next/font/google';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface NavEntry {
  href: string;
  label: string;
  Icon: typeof SparklesIcon;
}

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const paths = [
        '/',
        ...toolPages.map((t) => t.href),
      ];
      paths.forEach((path) => router.prefetch?.(path));
    } catch {}
  }, [router]);

  const toolsNavItems: NavEntry[] = toolPages.map(({ href, label, Icon }) => ({ href, label, Icon }));

  const linkClasses = (href: string) => {
    const isActive = pathname === href;
    return `relative text-sm flex items-center gap-2 transition-colors duration-200 ${
      isActive
        ? 'text-black after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-black'
        : 'text-black/70 hover:text-black'
    }`;
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="relative bg-white/40 backdrop-blur-xl border-b-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 flex justify-between items-center gap-3 z-[10000]">
      <Link href="/" className={`btn-shine text-3xl sm:text-4xl md:text-5xl font-medium tracking-wide text-black ${fredoka.className}`}>
        Tasaweers
        <span aria-hidden className="shine"></span>
      </Link>

      <nav className="hidden md:block">
        <ul className="flex items-center gap-6 text-black font-semibold">
          {toolsNavItems.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className={linkClasses(href)}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/text2image" className="flex items-center gap-2 text-sm text-black/70 hover:text-black transition-colors duration-200">
              <MagicWandIcon className="w-4 h-4" />
              Try Now
            </Link>
          </li>
        </ul>
      </nav>

      <button
        onClick={() => setIsMenuOpen((v) => !v)}
        className="md:hidden p-2 rounded-lg hover:bg-black/10 transition-colors duration-200"
        aria-label="Toggle mobile menu"
      >
        {isMenuOpen ? <XIcon className="w-6 h-6 text-black" /> : <MenuIcon className="w-6 h-6 text-black" />}
      </button>

      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] md:hidden max-h-96 overflow-y-auto z-[99999]">
          <nav className="px-6 py-4">
            <ul className="space-y-3 text-black font-semibold">
              {toolsNavItems.map(({ href, label, Icon }) => (
                <li key={href} className="flex items-center gap-2 rounded-lg p-2 hover:bg-black/10 transition duration-200">
                  <Icon className="w-5 h-5 text-black flex-shrink-0" />
                  <Link
                    href={href}
                    className="flex-1 text-left text-sm text-black/80 hover:text-black"
                    onClick={() => {
                      closeMenu();
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li className="flex items-center gap-2 rounded-lg p-2 hover:bg-black/10 transition duration-200">
                <MagicWandIcon className="w-5 h-5 text-black flex-shrink-0" />
                <Link
                  href="/text2image"
                  className="flex-1 text-left text-sm text-black/80 hover:text-black"
                  onClick={closeMenu}
                >
                  Start Creating
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};
