'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AtSign } from 'lucide-react';
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
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
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
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
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
        body: JSON.stringify({ email, code }),
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
        <div className="relative z-10 space-y-4 p-8 text-center sm:p-10">
          <h2 className="text-2xl font-medium tracking-tight text-black">Verification Code sent</h2>
          <p className="text-sm text-black/70">If you didn’t receive it, check spam or try again.</p>

          <form className="space-y-3 text-left" noValidate onSubmit={submit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-black" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                  <AtSign aria-hidden="true" className="h-5 w-5 flex-none" strokeWidth={1.8} />
                </span>
                <input
                  aria-describedby="email-error"
                  aria-invalid={status === 'error' && !email}
                  className="h-11 w-full rounded-[10px] border border-gray-300 bg-white/40 pl-10 pr-28 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
                  id="email"
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
              {status === 'error' && !email ? (
                <p className="mt-1 text-sm text-red-600" id="email-error">
                  Email is required
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-black">6-digit code</label>
              <div className="flex items-center justify-between gap-2">
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    aria-label={`Digit ${index + 1}`}
                    className="h-12 w-12 rounded-[10px] border border-gray-300 bg-white/40 text-center text-2xl focus:border-black focus:outline-none sm:h-14 sm:w-14"
                    inputMode="numeric"
                    maxLength={1}
                    onChange={(event) => {
                      const val = event.target.value.replace(/\D/g, '').slice(0, 1);
                      const next = [...digits];
                      next[index] = val;
                      setDigits(next);
                      if (val && index < OTP_LENGTH - 1) {
                        inputsRef.current[index + 1]?.focus();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Backspace' && !digits[index] && index > 0) {
                        inputsRef.current[index - 1]?.focus();
                      }
                    }}
                    onPaste={(event) => {
                      const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
                      if (!text) return;
                      event.preventDefault();
                      const next = Array(OTP_LENGTH).fill('');
                      for (let j = 0; j < text.length; j += 1) next[j] = text[j];
                      setDigits(next);
                      inputsRef.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
                    }}
                    pattern="[0-9]*"
                    value={digits[index]}
                  />
                ))}
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

          <div className="mt-2 text-sm">{message}</div>
          <div className="mt-2 text-sm text-black/70">
            <a className="text-black hover:underline" href="/login">
              Go to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
