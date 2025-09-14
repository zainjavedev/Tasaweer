"use client";

import React, { useEffect, useState } from 'react';
import LogoutButton from './LogoutButton';
import { CameraIcon, SparklesIcon, VideoCameraIcon, EnhanceIcon, CleanIcon } from './Icon';
import Link from 'next/link';
import { getToken } from '@/utils/authClient';

export const Header: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  useEffect(() => { setAuthed(!!getToken()); }, []);
  return (
    <header className="bg-white/90 backdrop-blur dark:bg-gray-800/90 shadow-md">
      <div className="container mx-auto px-4 py-6 flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center gap-3">
          <div className="relative">
            <span className="absolute -inset-3 rounded-full bg-gradient-to-tr from-indigo-400/30 to-fuchsia-400/30 blur-lg" />
            <CameraIcon className="relative h-10 w-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-amber-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient">
                Tasaweers
              </h1>
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-600/10 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300 border border-indigo-300/40">Beta</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI visual editor for real estate, products, and more</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-indigo-600 dark:text-indigo-400">
          <SparklesIcon className="w-5 h-5 animate-float" />
          <VideoCameraIcon className="w-5 h-5" />
          <EnhanceIcon className="w-5 h-5" />
          <CleanIcon className="w-5 h-5" />
        </div>
        <div className="mt-2">
          {authed ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="px-3 py-1.5 rounded bg-white/70 dark:bg-gray-700/70 border text-sm font-semibold hover:bg-white dark:hover:bg-gray-700">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
};
