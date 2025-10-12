'use client';

import React, { useState } from 'react';
import { AtSign, KeyRound, UserRound } from 'lucide-react';
import { Fredoka } from 'next/font/google';
import { useRouter } from 'next/navigation';
import loginBg from '@/assets/login-bg.png';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function RegisterClient() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.replace(`/verify?email=${encodeURIComponent(email)}`);
      setTimeout(() => setLoading(false), 150);
      return;
    } catch (err: any) {
      setError(err?.message || 'Failed');
      setLoading(false);
    }
  };

  return (
    <div className={`${fredoka.className} relative w-full`}>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${(loginBg as any).src || (loginBg as unknown as string)})` }}
      />

      <div className="relative mx-auto max-w-md overflow-hidden rounded-[12px] border-2 border-white/30 bg-white/40 p-0 text-gray-900 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="relative z-10 space-y-5 p-8 sm:p-10">
          <div className="text-center">
            <h2 className="text-2xl font-medium tracking-tight text-black">Create account</h2>
            <p className="mt-1 text-sm text-black/70">You're very close to imagining things</p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-black">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                  <AtSign aria-hidden="true" className="h-5 w-5 flex-none" strokeWidth={1.8} />
                </span>
                <input
                  className="h-11 w-full rounded-[10px] border border-gray-300 bg-white/40 pl-10 pr-3 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                  <UserRound aria-hidden="true" className="h-5 w-5 flex-none" strokeWidth={1.8} />
                </span>
                <input
                  className="h-11 w-full rounded-[10px] border border-gray-300 bg-white/40 pl-10 pr-3 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  required
                  value={username}
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
                  className="h-11 w-full rounded-[10px] border border-gray-300 bg-white/40 pl-10 pr-3 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  type="password"
                  value={password}
                />
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
              {loading ? 'Creating…' : 'Create account'}
              <span aria-hidden className="shine"></span>
            </button>
          </form>
          <div className="text-center text-sm text-black/70">
            Already have an account?{' '}
            <a className="text-black hover:underline" href="/login">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
