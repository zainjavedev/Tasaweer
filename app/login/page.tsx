'use client';

import React, { useState } from 'react';
import loginBg from '@/assets/login-bg.png';
import { AtSign, KeyRound } from 'lucide-react';
import { Fredoka } from 'next/font/google';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400','500','600','700'] });
import { useRouter } from 'next/navigation';
import { setToken } from '@/utils/authClient';
import { setUserLimits } from '@/utils/userLimits';

export default function Page() {
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier.includes('@') ? undefined : identifier, email: identifier.includes('@') ? identifier : undefined, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data?.unverified && data?.email) {
        router.replace(`/verify?email=${encodeURIComponent(data.email)}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (!data.token) throw new Error('No token returned');
      setToken(data.token);

      // Store user limits data for frontend usage
      setUserLimits({
        imageCount: data.imageCount,
        imageLimit: data.imageLimit,
        role: data.role
      });

      router.replace('/');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${fredoka.className} relative w-full`}>
      {/* Background image */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${(loginBg as any).src || (loginBg as unknown as string)})` }}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative max-w-md mx-auto bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-0 text-gray-900 overflow-hidden">

        {/* Content */}
        <div className="relative z-10 p-8 sm:p-10 space-y-5">
        {/* Removed top icon per request */}
        <div className="text-center">
          <h2 className="text-2xl font-medium tracking-tight text-black">Get started</h2>
          <p className="mt-1 text-sm text-black/70 text-center">Let's get back to imagining things</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Email or Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                <AtSign className="w-5 h-5 flex-none" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full h-11 pl-10 pr-3 rounded-[10px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                placeholder="you@example.com or yourname"
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                <KeyRound className="w-5 h-5 flex-none" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-[10px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto inline-flex items-center justify-center p-1.5 rounded-md text-black/60 hover:text-black focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                    <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.58 10.58a3 3 0 004.24 4.24" />
                    <path d="M16.681 16.681C15.23 17.505 13.66 18 12 18 7 18 3.27 14.94 2 12c.51-1.12 1.35-2.29 2.46-3.33" strokeLinecap="round"/>
                    <path d="M9.88 5.51C10.56 5.34 11.27 5.25 12 5.25 17 5.25 20.73 8.31 22 11.25c-.42.92-1.03 1.85-1.79 2.69" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                    <path d="M2 12s3.5-6.75 10-6.75S22 12 22 12s-3.5 6.75-10 6.75S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3.25" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50/80 dark:bg-red-900/30 p-2 rounded-md">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="btn-shine relative w-full h-11 px-4 rounded-[10px] bg-black text-white font-medium tracking-wide shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:brightness-110 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black/30"
          >
            {loading ? 'Logging in…' : 'Login'}
            <span aria-hidden className="shine"></span>
          </button>
        </form>

        <div className="text-sm text-black/70 text-center">
          Or <a href="/register" className="text-black hover:underline">create a free account</a>.
        </div>
        </div>
      </div>
    </div>
  );
}
