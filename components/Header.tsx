"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  UsersIcon,
  StarIcon,
  MenuIcon,
  XIcon,
  SparklesIcon,
  BoxIcon,
  ShieldIcon,
  ChevronDownIcon,
} from './Icon';
import { toolPages } from '@/lib/tools';
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
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, loading, refreshUserData } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const toolsMenuRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const paths = [
        '/',
        '/login',
        '/register',
        '/text2image',
        '/try-apparel',
        '/photo-editor',
        '/youtube-thumbnail-editor',
        '/gemini-watermark-remover',
        '/profile',
        '/admin',
      ];
      paths.forEach((path) => router.prefetch?.(path));
    } catch {}
  }, [router]);

  const toolsNavItems: NavEntry[] = toolPages.map(({ href, label, Icon }) => ({ href, label, Icon }));

  const authenticatedLinks: NavEntry[] = [
    { href: '/profile', label: 'Settings', Icon: UsersIcon },
    ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Admin', Icon: ShieldIcon }] : []),
  ];

  const guestLinks: NavEntry[] = [
    { href: '/login', label: 'Login', Icon: UsersIcon },
    { href: '/register', label: 'Sign Up', Icon: StarIcon },
  ];

  const linkClasses = (href: string) => {
    const isActive = pathname === href;
    return `relative text-sm flex items-center gap-2 transition-colors duration-200 ${
      isActive
        ? 'text-black after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:bg-black'
        : 'text-black/70 hover:text-black'
    }`;
  };

  const dropdownLinkClasses = (href: string) => {
    const isActive = pathname === href;
    return `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
      isActive ? 'bg-black text-white' : 'text-black/70 hover:bg-black/10 hover:text-black'
    }`;
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsToolsOpen(false);
  };
  const requestLogout = () => {
    setShowLogoutConfirm(true);
    closeMenu();
  };

  const performLogout = async () => {
    // Clear server HttpOnly cookie first
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    // Clear client tokens and caches
    try {
      clearToken();
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    } catch {}

    setShowLogoutConfirm(false);
    // Refresh header state immediately so UI switches away from authed view
    await refreshUserData();
    router.replace('/login');
  };

  useEffect(() => {
    if (!isToolsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isToolsOpen]);

  useEffect(() => {
    setIsToolsOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const isToolsActive = toolsNavItems.some(({ href }) => pathname === href);

  return (
    <header className="relative bg-white/40 backdrop-blur-xl border-b-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 flex justify-between items-center gap-3 z-[10000]">
      <Link href="/" className={`btn-shine text-3xl sm:text-4xl md:text-5xl font-medium tracking-wide text-black ${fredoka.className}`}>
        Tasaweers
        <span aria-hidden className="shine"></span>
      </Link>

      <nav className="hidden md:block">
        <ul className="flex items-center gap-6 text-black font-semibold">
          <li ref={toolsMenuRef} className="relative">
            {loading ? (
              <div className="h-8 w-24 rounded-lg bg-black/10 animate-pulse" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsToolsOpen((open) => !open)}
                  className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
                    isToolsActive ? 'text-black' : 'text-black/70 hover:text-black'
                  }`}
                >
                  <SparklesIcon className="w-4 h-4" />
                  Tools
                  <ChevronDownIcon className={`w-3 h-3 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
                </button>
                {isToolsOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-black/10 bg-white/95 p-3 shadow-lg">
                    <div className="flex flex-col gap-1">
                      {toolsNavItems.map(({ href, label, Icon }) => (
                        <Link
                          key={href}
                          href={href}
                          className={dropdownLinkClasses(href)}
                          onClick={() => setIsToolsOpen(false)}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </li>
          {loading ? (
            <>
              <li className="flex items-center gap-2 text-sm text-black">
                <div className="h-4 w-24 rounded bg-black/10 animate-pulse" />
              </li>
              <li className="flex items-center gap-2 text-sm text-black">
                <div className="h-4 w-20 rounded bg-black/10 animate-pulse" />
              </li>
              <li>
                <div className="h-8 w-24 rounded-lg bg-black/10 animate-pulse" />
              </li>
            </>
          ) : user ? (
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
              <li className="text-xs uppercase tracking-wide text-black/50">Tools</li>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <li key={`tools-skel-${i}`} className="flex items-center gap-2 rounded-lg p-2">
                    <div className="w-5 h-5 bg-black/10 rounded" />
                    <div className="h-4 w-40 bg-black/10 rounded animate-pulse" />
                  </li>
                ))
              ) : (
                toolsNavItems.map(({ href, label, Icon }) => (
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
                ))
              )}
              {loading ? (
                <>
                  <li className="flex items-center gap-2 rounded-lg p-2">
                    <div className="w-5 h-5 bg-black/10 rounded" />
                    <div className="h-4 w-32 bg-black/10 rounded animate-pulse" />
                  </li>
                  <li className="flex items-center gap-2 rounded-lg p-2">
                    <div className="w-5 h-5 bg-black/10 rounded" />
                    <div className="h-4 w-24 bg-black/10 rounded animate-pulse" />
                  </li>
                  <li className="flex items-center gap-2 rounded-lg p-2">
                    <div className="h-8 w-full bg-black/10 rounded animate-pulse" />
                  </li>
                </>
              ) : user ? (
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

      {mounted && showLogoutConfirm && createPortal(
        <div className="fixed inset-0 min-h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10001]">
          <div className="bg-white rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6 max-w-sm w-full">
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
        </div>,
        document.body
      )}
    </header>
  );
};
