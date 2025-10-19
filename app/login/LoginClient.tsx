'use client';

import React, { useState } from 'react';
import { AtSign, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import loginBg from '@/assets/login-bg.png';
import { setToken } from '@/utils/authClient';
import { setUserLimits } from '@/utils/userLimits';


export default function LoginClient() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier.includes('@') ? undefined : identifier,
          email: identifier.includes('@') ? identifier : undefined,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data?.unverified && data?.email) {
        router.replace(`/verify?email=${encodeURIComponent(data.email)}`);
        setTimeout(() => setLoading(false), 150);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (!data.token) throw new Error('No token returned');
      setToken(data.token);

      if (data.limits) {
        setUserLimits(data.limits);
      }

      router.replace('/profile');
      setTimeout(() => setLoading(false), 150);
    } catch (err: any) {
      setError(err?.message || 'Failed');
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${(loginBg as any).src || (loginBg as unknown as string)})` }}
      />

      <div className="relative mx-auto max-w-md overflow-hidden rounded-[12px] border-2 border-white/30 bg-white/40 p-0 text-gray-900 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="relative z-10 space-y-5 p-8 sm:p-10">
          <div className="text-center">
            <h2 className="text-2xl font-medium tracking-tight text-black">Welcome back</h2>
            <p className="mt-1 text-sm text-black/70">Log in to continue imagining things</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-black">Email or username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                  <AtSign aria-hidden="true" className="h-5 w-5 flex-none" strokeWidth={1.8} />
                </span>
                <input
                  autoComplete="username"
                  className="h-11 w-full rounded-[10px] border border-gray-300 bg-white/40 pl-10 pr-3 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  required
                  value={identifier}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                  <KeyRound aria-hidden="true" className="h-5 w-5 flex-none" strokeWidth={1.8} />
                </span>
                <input
                  autoComplete="current-password"
                  className="h-11 w-full rounded-[10px] border border-gray-300 bg-white/40 pl-10 pr-3 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  className="absolute inset-y-0 right-3 text-sm font-medium text-black/70 hover:text-black"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error ? (
              <div
                className="rounded-md border border-red-300 bg-red-50/80 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            ) : null}
            <button
              className="btn-shine relative h-11 w-full rounded-[10px] bg-black px-4 font-medium tracking-wide text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-black/30 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Log in'}
              <span aria-hidden className="shine"></span>
            </button>
          </form>

          <div className="text-center text-sm text-black/70">
            New to Tasaweers?{' '}
            <a className="text-black hover:underline" href="/register">
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
