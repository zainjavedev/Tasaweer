"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UsersIcon, StarIcon, MenuIcon, XIcon, SparklesIcon, SwapIcon, MagicWandIcon, BoxIcon, ShieldIcon } from './Icon';
import { Fredoka } from 'next/font/google';
import { getToken, clearToken, getUsernameFromToken } from '@/utils/authClient';
import { useUser } from '@/utils/useUser';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400','500','600','700'] });

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { user, refreshUserData } = useUser();
  const router = useRouter();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prefetch important pages to reduce perceived latency
  useEffect(() => {
    try {
      // @ts-ignore app router router has prefetch
      router.prefetch?.('/login');
      router.prefetch?.('/');
      router.prefetch?.('/text2image');
      router.prefetch?.('/try-apparel');
      router.prefetch?.('/photo-editor');
      router.prefetch?.('/profile');
      router.prefetch?.('/signup');
    } catch {}
  }, [router]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Instant navigation with visual feedback
  const navigateInstantly = (path: string) => {
    if (isNavigating) return;

    setIsNavigating(true);
    setIsMenuOpen(false); // Close mobile menu

    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Start navigation immediately but with fallback delay
    router.push(path);

    // Reset navigation state after short delay to prevent UI freeze
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
    }, 100);
  };

  const isAuthenticated = !!user;
  const username = user?.username;

  const handleLogout = () => {
    if (isNavigating) return;

    // Set navigation state to prevent double-clicks
    setIsNavigating(true);

    // Clear tokens and storage immediately
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

    // Navigate after clearing data
    router.replace('/login');

    // Refresh user data and reset navigation state after short delay
    setTimeout(() => {
      refreshUserData();
      setIsNavigating(false);
    }, 100);
  };

  return (
    <header className="relative bg-white/40 backdrop-blur-xl border-b-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] px-6 py-4 md:px-8 lg:px-12 flex justify-between items-center z-[10000]">
      <Link href="/" className={`btn-shine text-4xl md:text-5xl font-medium tracking-wide text-black ${fredoka.className}`}>
        Tasaweers
        <span aria-hidden className="shine"></span>
      </Link>
      {/* Desktop Navigation */}
      <nav className="hidden md:block">
        <ul className="flex gap-6 text-black font-semibold">
          <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
            <SparklesIcon className="w-4 h-4 text-black" />
            <button
              onClick={() => navigateInstantly('/text2image')}
              disabled={isNavigating}
              className="hover:text-black transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Text → Image
            </button>
          </li>
          <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
            <SwapIcon className="w-4 h-4 text-black" />
            <button
              onClick={() => navigateInstantly('/try-apparel')}
              disabled={isNavigating}
              className="hover:text-black transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Try Apparel
            </button>
          </li>
          <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
            <MagicWandIcon className="w-4 h-4 text-black" />
            <button
              onClick={() => navigateInstantly('/photo-editor')}
              disabled={isNavigating}
              className="hover:text-black transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Photo Editor
            </button>
          </li>
          {isAuthenticated ? (
            <>
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <UsersIcon className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">
                  Hi, {username || 'User'}!
                </span>
              </li>
              <li className="flex items-center gap-2">
                <BoxIcon className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">
                  {user?.imageCount || 0}/{user?.imageLimit ?? '∞'}
                </span>
              </li>
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <UsersIcon className="w-4 h-4 text-black" />
                <button
                  onClick={() => navigateInstantly('/profile')}
                  disabled={isNavigating}
                  className="hover:text-black transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Profile
                </button>
              </li>
              {user?.role === 'ADMIN' && (
                <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                  <ShieldIcon className="w-4 h-4 text-black" />
                  <button
                    onClick={() => navigateInstantly('/admin')}
                    disabled={isNavigating}
                    className="hover:text-black transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Admin
                  </button>
                </li>
              )}
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <StarIcon className="w-4 h-4 text-black" />
                <button
                  onClick={handleLogout}
                  disabled={isNavigating}
                  className="hover:text-black transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <UsersIcon className="w-4 h-4 text-black" />
                <button
                  onClick={() => navigateInstantly('/login')}
                  disabled={isNavigating}
                  className="hover:text-black transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Login
                </button>
              </li>
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <StarIcon className="w-4 h-4 text-black" />
                <button
                  onClick={() => navigateInstantly('/signup')}
                  disabled={isNavigating}
                  className="hover:text-black transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign Up
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-lg hover:bg-black/10 transition-colors duration-200"
        aria-label="Toggle mobile menu"
      >
        {isMenuOpen ? (
          <XIcon className="w-6 h-6 text-black" />
        ) : (
          <MenuIcon className="w-6 h-6 text-black" />
        )}
      </button>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] md:hidden max-h-96 overflow-y-auto z-[99999]">
          <nav className="px-6 py-4">
            <ul className="space-y-3 text-black font-semibold">
              <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                <SparklesIcon className="w-5 h-5 text-black flex-shrink-0" />
                <button
                  onClick={() => navigateInstantly('/text2image')}
                  disabled={isNavigating}
                  className="hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Text → Image
                </button>
              </li>
              <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                <SwapIcon className="w-5 h-5 text-black flex-shrink-0" />
                <button
                  onClick={() => navigateInstantly('/try-apparel')}
                  disabled={isNavigating}
                  className="hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Try Apparel
                </button>
              </li>
              <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                <MagicWandIcon className="w-5 h-5 text-black flex-shrink-0" />
                <button
                  onClick={() => navigateInstantly('/photo-editor')}
                  disabled={isNavigating}
                  className="hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Photo Editor
                </button>
              </li>
              {isAuthenticated ? (
                <>
                  <li className="flex items-center gap-2 rounded-lg p-2 transition duration-200">
                    <UsersIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <span className="text-sm font-medium text-black">
                      Hi, {username || 'User'}!
                    </span>
                  </li>
                  <li className="flex items-center gap-2 rounded-lg p-2 transition duration-200">
                    <BoxIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <span className="text-sm font-medium text-black">
                      Images: {user?.imageCount || 0}/{user?.imageLimit ?? '∞'}
                    </span>
                  </li>
                  <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                    <UsersIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <button
                      onClick={() => navigateInstantly('/profile')}
                      disabled={isNavigating}
                      className="hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Profile
                    </button>
                  </li>
                  {user?.role === 'ADMIN' && (
                    <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                      <ShieldIcon className="w-5 h-5 text-black flex-shrink-0" />
                      <button
                        onClick={() => navigateInstantly('/admin')}
                        disabled={isNavigating}
                        className="hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Admin
                      </button>
                    </li>
                  )}
                  <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                    <StarIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <button
                      onMouseDown={() => {
                        setShowLogoutConfirm(true);
                        closeMenu();
                      }}
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        closeMenu();
                      }}
                      className="hover:text-black transition duration-300"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                    <UsersIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <button
                      onClick={() => navigateInstantly('/login')}
                      disabled={isNavigating}
                      className="hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Login
                    </button>
                  </li>
                  <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                    <StarIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <button
                      onClick={() => navigateInstantly('/signup')}
                      disabled={isNavigating}
                      className="hover:text-black transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sign Up
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-black/10 rounded-full flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-medium text-black mb-2">Confirm Logout</h3>
              <p className="text-black/60">Are you sure you want to log out? You can always log back in.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 bg-white/40 text-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (isNavigating) return;

                  // Set navigation state
                  setIsNavigating(true);

                  // Clear all storage immediately
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
                  setTimeout(() => {
                    setIsMenuOpen(false);
                    refreshUserData();
                    setIsNavigating(false);
                  }, 100);
                }}
                className="btn-shine flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-200"
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
