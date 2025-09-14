'use client';

import React, { useState } from 'react';
import loginBg from '@/assets/login-bg.png';
import { AtSign, KeyRound, UserRound } from 'lucide-react';
import { Fredoka } from 'next/font/google';
import { useRouter } from 'next/navigation';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400','500','600','700'] });

export default function Page() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, username, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.replace(`/verify?email=${encodeURIComponent(email)}`);
      return;
    } catch (e: any) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); }
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
        <div className="relative z-10 p-8 sm:p-10 space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-medium tracking-tight text-black">Create account</h2>
            <p className="mt-1 text-sm text-black/70">You're very close to imagining things</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                    <AtSign className="w-5 h-5 flex-none" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <input type="email" required
                    className="w-full h-11 pl-10 pr-3 rounded-[10px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                    placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-black">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                    <UserRound className="w-5 h-5 flex-none" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <input required
                    className="w-full h-11 pl-10 pr-3 rounded-[10px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                    placeholder="yourname"
                    value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-black">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                    <KeyRound className="w-5 h-5 flex-none" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <input type="password" required
                    className="w-full h-11 pl-10 pr-3 rounded-[10px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                    placeholder="Create a password"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              {error && (<div role="alert" className="rounded-md border border-red-300 bg-red-50/80 text-red-700 px-3 py-2 text-sm">{error}</div>)}
              <button disabled={loading} className="btn-shine relative w-full h-11 px-4 rounded-[10px] bg-black text-white font-medium tracking-wide shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:brightness-110 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black/30">
                {loading ? 'Creating…' : 'Create account'}
                <span aria-hidden className="shine"></span>
              </button>
          </form>
          <div className="text-sm text-black/70 text-center">Already have an account? <a href="/login" className="text-black hover:underline">Login</a></div>
        </div>
      </div>
    </div>
  );
}
