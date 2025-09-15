"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HomeIcon, UsersIcon, StarIcon, MenuIcon, XIcon, SparklesIcon, SwapIcon, MagicWandIcon, SparklesIcon as WandIcon, BoxIcon } from './Icon';
import { Fredoka } from 'next/font/google';
import { getToken, clearToken, getUsernameFromToken } from '@/utils/authClient';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400','500','600','700'] });

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      if (token) {
        setIsAuthenticated(true);
        setUsername(getUsernameFromToken());
      } else {
        setIsAuthenticated(false);
        setUsername(null);
      }
    };

    checkAuth();
    // Listen for storage changes (when token is set/cleared in other components)
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    clearToken();
    // Clear all localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      // Clear cookies by setting them to expire
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    setIsAuthenticated(false);
    setUsername(null);
    router.push('/login');
  };

  return (
    <header className="bg-white/40 backdrop-blur-xl border-b-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] px-6 py-4 md:px-8 lg:px-12 flex justify-between items-center">
      <div className={`btn-shine text-4xl md:text-5xl font-medium tracking-wide text-black ${fredoka.className}`}>
        Tasaweers
        <span aria-hidden className="shine"></span>
      </div>
      {/* Desktop Navigation */}
      <nav className="hidden md:block">
        <ul className="flex gap-6 text-black font-semibold">
          <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
            <HomeIcon className="w-4 h-4 text-black" />
            <Link href="/" className="hover:text-black transition duration-300 text-sm">
              Home
            </Link>
          </li>
          <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
            <SparklesIcon className="w-4 h-4 text-black" />
            <Link href="/text2image" className="hover:text-black transition duration-300 text-sm">
              Text → Image
            </Link>
          </li>
          <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
            <SwapIcon className="w-4 h-4 text-black" />
            <Link href="/try-apparel" className="hover:text-black transition duration-300 text-sm">
              Try Apparel
            </Link>
          </li>
          <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
            <MagicWandIcon className="w-4 h-4 text-black" />
            <Link href="/photo-editor" className="hover:text-black transition duration-300 text-sm">
              Photo Editor
            </Link>
          </li>
          {isAuthenticated ? (
            <>
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <UsersIcon className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">
                  Hi, {username || 'User'}!
                </span>
              </li>
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <StarIcon className="w-4 h-4 text-black" />
                <button
                  onClick={handleLogout}
                  className="hover:text-black transition duration-300 text-sm"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <UsersIcon className="w-4 h-4 text-black" />
                <Link href="/login" className="hover:text-black transition duration-300 text-sm">
                  Login
                </Link>
              </li>
              <li className="flex items-center gap-2 hover:scale-105 transition-all duration-200">
                <StarIcon className="w-4 h-4 text-black" />
                <Link href="/signup" className="hover:text-black transition duration-300 text-sm">
                  Sign Up
                </Link>
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
        <div className="absolute top-full left-0 right-0 bg-white/40 backdrop-blur-xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] md:hidden max-h-96 overflow-y-auto">
          <nav className="px-6 py-4">
            <ul className="space-y-3 text-black font-semibold">
              <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                <HomeIcon className="w-5 h-5 text-black flex-shrink-0" />
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="hover:text-black transition duration-300"
                >
                  Home
                </Link>
              </li>
              <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                <SparklesIcon className="w-5 h-5 text-black flex-shrink-0" />
                <Link
                  href="/text2image"
                  onClick={closeMenu}
                  className="hover:text-black transition duration-300"
                >
                  Text → Image
                </Link>
              </li>
              <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                <SwapIcon className="w-5 h-5 text-black flex-shrink-0" />
                <Link
                  href="/try-apparel"
                  onClick={closeMenu}
                  className="hover:text-black transition duration-300"
                >
                  Try Apparel
                </Link>
              </li>
              <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                <MagicWandIcon className="w-5 h-5 text-black flex-shrink-0" />
                <Link
                  href="/photo-editor"
                  onClick={closeMenu}
                  className="hover:text-black transition duration-300"
                >
                  Photo Editor
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li className="flex items-center gap-2 rounded-lg p-2 transition duration-200">
                    <UsersIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <span className="text-sm font-medium text-black">
                      Hi, {username || 'User'}!
                    </span>
                  </li>
                  <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                    <StarIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <button
                      onClick={() => {
                        handleLogout();
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
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="hover:text-black transition duration-300"
                    >
                      Login
                    </Link>
                  </li>
                  <li className="flex items-center gap-2 hover:bg-black/10 rounded-lg p-2 transition duration-200">
                    <StarIcon className="w-5 h-5 text-black flex-shrink-0" />
                    <Link
                      href="/signup"
                      onClick={closeMenu}
                      className="hover:text-black transition duration-300"
                    >
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

