'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AtSign, KeyRound } from 'lucide-react';
import { Fredoka } from 'next/font/google';
import { useRouter, useSearchParams } from 'next/navigation';
import loginBg from '@/assets/login-bg.png';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const OTP_LENGTH = 6;

export default function VerifyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending');
  const [message, setMessage] = useState('Enter the 6-digit code we emailed you.');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    const prefill = searchParams.get('email');
    if (prefill) setEmail(prefill);
    setStatus('pending');
  }, [searchParams]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setStatus('error');
      setMessage('Email is required');
      return;
    }
    const cleaned = code.replace(/\D/g, '');
    if (cleaned.length !== OTP_LENGTH) {
      setStatus('error');
      setMessage('Enter the full 6-digit code');
      return;
    }
    setLoading(true);
    setMessage('Verifying…');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: cleaned }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setStatus('ok');
      setMessage('Email verified! You may now sign in.');
      router.replace('/login');
      setTimeout(() => setLoading(false), 150);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Verification failed');
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!email) return;
    try {
      setResending(true);
      setMessage('Sending a new code…');
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not resend');
      setMessage('A new code was sent to your email.');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to resend');
    } finally {
      setResending(false);
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
            <h2 className="text-2xl font-medium tracking-tight text-black">Verify your email</h2>
            <p className="mt-1 text-sm text-black/70">Enter the {OTP_LENGTH}-digit code we sent to your email.</p>
          </div>

          <form className="space-y-4" onSubmit={submit} noValidate>
            <div>
              <label className="mb-1 block text-sm font-medium text-black" htmlFor="email">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                  <AtSign aria-hidden className="h-5 w-5 flex-none" strokeWidth={1.8} />
                </span>
                <input
                  id="email"
                  className="h-11 w-full rounded-[10px] border border-gray-300 bg-white/40 pl-10 pr-28 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
                <div className="absolute inset-y-0 right-2 my-auto">
                  <button
                    className="h-8 rounded-[8px] px-3 text-sm text-black/80 transition hover:text-black disabled:opacity-50"
                    disabled={!email || resending}
                    onClick={resendCode}
                    type="button"
                  >
                    {resending ? 'Resending…' : 'Resend'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-black" htmlFor="code">Verification code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                  <KeyRound aria-hidden className="h-5 w-5 flex-none" strokeWidth={1.8} />
                </span>
                <input
                  ref={inputRef}
                  id="code"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  pattern="[0-9]*"
                  className="h-11 w-full rounded-[10px] border border-gray-300 bg-white/40 pl-10 pr-3 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none tracking-widest"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                />
              </div>
            </div>

            <button
              className="btn-shine relative h-11 w-full rounded-[10px] bg-black px-4 font-medium tracking-wide text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-black/30 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Verifying…' : 'Verify'}
              <span aria-hidden className="shine"></span>
            </button>
          </form>

          <div className="text-center text-sm">{message}</div>
          <div className="text-center text-sm text-black/70">
            <a className="text-black hover:underline" href="/login">Go to login</a>
          </div>
        </div>
      </div>
    </div>
  );
}
