"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  UsersIcon,
  StarIcon,
  MenuIcon,
  XIcon,
  SparklesIcon,
  SwapIcon,
  MagicWandIcon,
  BoxIcon,
  ShieldIcon,
} from './Icon';
import { Fredoka } from 'next/font/google';
import { clearToken } from '@/utils/authClient';
import { useUser } from '@/utils/useUser';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface NavEntry {
  href: string;
  label: string;
  Icon: typeof SparklesIcon;
}

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, refreshUserData } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const paths = [
        '/',
        '/login',
        '/signup',
        '/text2image',
        '/try-apparel',
        '/photo-editor',
        '/profile',
        '/admin',
      ];
      paths.forEach((path) => router.prefetch?.(path));
    } catch {}
  }, [router]);

  const navItems: NavEntry[] = [
    { href: '/text2image', label: 'Text → Image', Icon: SparklesIcon },
    { href: '/try-apparel', label: 'Try Apparel', Icon: SwapIcon },
    { href: '/photo-editor', label: 'Photo Editor', Icon: MagicWandIcon },
  ];

  const authenticatedLinks: NavEntry[] = [
    { href: '/profile', label: 'Profile', Icon: UsersIcon },
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin', Icon: ShieldIcon }] : []),
  ];

  const guestLinks: NavEntry[] = [
    { href: '/login', label: 'Login', Icon: UsersIcon },
    { href: '/signup', label: 'Sign Up', Icon: StarIcon },
  ];

  const linkClasses = (href: string) => {
    const isActive = pathname === href;
    return `relative text-sm flex items-center gap-2 transition-colors duration-200 ${
      isActive
        ? 'text-black after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-black'
        : 'text-black/70 hover:text-black'
    }`;
  };

  const closeMenu = () => setIsMenuOpen(false);
  const requestLogout = () => {
    setShowLogoutConfirm(true);
    closeMenu();
  };

  const performLogout = () => {
    try {
      clearToken();
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^\s+/, '')
            .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
        });
      }
    } catch {}

    router.replace('/login');
    setShowLogoutConfirm(false);
    setTimeout(() => {
      refreshUserData();
    }, 100);
  };

  return (
    <header className="relative bg-white/40 backdrop-blur-xl border-b-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] px-6 py-4 md:px-8 lg:px-12 flex justify-between items-center z-[10000]">
      <Link href="/" className={`btn-shine text-4xl md:text-5xl font-medium tracking-wide text-black ${fredoka.className}`}>
        Tasaweers
        <span aria-hidden className="shine"></span>
      </Link>

      <nav className="hidden md:block">
        <ul className="flex items-center gap-6 text-black font-semibold">
          {navItems.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className={linkClasses(href)}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            </li>
          ))}
          {user ? (
            <>
              <li className="flex items-center gap-2 text-sm text-black">
                <UsersIcon className="w-4 h-4" />
                Hi, {user.username || 'User'}!
              </li>
              <li className="flex items-center gap-2 text-sm text-black">
                <BoxIcon className="w-4 h-4" />
                {user.imageCount || 0}/{user.imageLimit ?? '∞'}
              </li>
              {authenticatedLinks.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link href={href} className={linkClasses(href)}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={requestLogout}
                  className="text-sm text-black/70 hover:text-black transition-colors duration-200 flex items-center gap-2"
                >
                  <StarIcon className="w-4 h-4" /> Logout
                </button>
              </li>
            </>
          ) : (
            guestLinks.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} className={linkClasses(href)}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              </li>
            ))
          )}
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
              {navItems.map(({ href, label, Icon }) => (
                <li key={href} className="flex items-center gap-2 rounded-lg p-2 hover:bg-black/10 transition duration-200">
                  <Icon className="w-5 h-5 text-black flex-shrink-0" />
                  <Link
                    href={href}
                    className="flex-1 text-left text-sm text-black/80 hover:text-black"
                    onClick={closeMenu}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {user ? (
                <>
                  <li className="flex items-center gap-2 rounded-lg p-2 text-sm text-black">
                    <UsersIcon className="w-5 h-5 text-black flex-shrink-0" />
                    Hi, {user.username || 'User'}!
                  </li>
                  <li className="flex items-center gap-2 rounded-lg p-2 text-sm text-black">
                    <BoxIcon className="w-5 h-5 text-black flex-shrink-0" />
                    Images: {user.imageCount || 0}/{user.imageLimit ?? '∞'}
                  </li>
                  {authenticatedLinks.map(({ href, label, Icon }) => (
                    <li key={href} className="flex items-center gap-2 rounded-lg p-2 hover:bg-black/10 transition duration-200">
                      <Icon className="w-5 h-5 text-black flex-shrink-0" />
                      <Link
                        href={href}
                        className="flex-1 text-left text-sm text-black/80 hover:text-black"
                        onClick={closeMenu}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 rounded-lg p-2 hover:bg-black/10 transition duration-200">
                    <StarIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <button
                      onClick={requestLogout}
                      className="flex-1 text-left text-sm text-black/80 hover:text-black"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                guestLinks.map(({ href, label, Icon }) => (
                  <li key={href} className="flex items-center gap-2 rounded-lg p-2 hover:bg-black/10 transition duration-200">
                    <Icon className="w-5 h-5 text-black flex-shrink-0" />
                    <Link
                      href={href}
                      className="flex-1 text-left text-sm text-black/80 hover:text-black"
                      onClick={closeMenu}
                    >
                      {label}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </nav>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-black/10 rounded-full flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-medium text-black mb-2">Confirm Logout</h3>
              <p className="text-black/60">You can log back in anytime.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white/40 text-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={performLogout}
                className="btn-shine flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors duration-200"
              >
                Logout
                <span aria-hidden className="shine"></span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
