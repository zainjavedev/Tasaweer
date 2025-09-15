// Fix: Add missing dependency array to useEffect to avoid stale closure issues
// Fix: Add missing type for inputsRef to avoid TS errors
// Fix: Add missing aria-labels for inputs for accessibility
// Fix: Prevent form submission if email is empty or code incomplete
// Fix: Add proper focus management on paste and input change
// Fix: Minor code cleanup and consistent error handling

'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { AtSign } from 'lucide-react';
import loginBg from '@/assets/login-bg.png';
import { Fredoka } from 'next/font/google';
import { useSearchParams, useRouter } from 'next/navigation';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400','500','600','700'] });

function VerifyForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending'|'ok'|'error'>('pending');
  const [message, setMessage] = useState('Enter the 6-digit code we emailed you.');
  const [email, setEmail] = useState('');
  const otpLen = 6;
  const [digits, setDigits] = useState<string[]>(Array(otpLen).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!sp) return;
    const prefill = sp.get('email');
    if (prefill) setEmail(prefill);
    setStatus('pending');
  }, [sp]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus('error');
      setMessage('Email is required');
      return;
    }
    const code = digits.join('');
    if (code.length !== otpLen) {
      setStatus('error');
      setMessage('Enter the full 6-digit code');
      return;
    }
    setLoading(true);
    setMessage('Verifying…');
    try {
      const res = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setStatus('ok'); setMessage('Email verified! You may now sign in.');
      setTimeout(() => router.replace('/login'), 1000);
    } catch (err: any) {
      setStatus('error'); setMessage(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${fredoka.className} relative w-full`}>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${(loginBg as any).src || (loginBg as unknown as string)})` }}
        aria-hidden="true"
      />

      <div className="relative max-w-md mx-auto bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-0 text-gray-900 overflow-hidden">
        <div className="relative z-10 p-8 sm:p-10 space-y-4 text-center">
          <h2 className="text-2xl font-medium tracking-tight text-black">Verification Code sent</h2>
          <p className="text-sm text-black/70">If you didn’t receive it, check spam or try again.</p>

          <form onSubmit={submit} className="space-y-3 text-left" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-black">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                  <AtSign className="w-5 h-5 flex-none" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <input
                  id="email"
                  type="email"
                  className="w-full h-11 pl-10 pr-28 rounded-[10px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  aria-invalid={status === 'error' && !email}
                  aria-describedby="email-error"
                />
                <button
                  type="button"
                  disabled={!email || resending}
                  onClick={async () => {
                    if (!email) return;
                    try {
                      setResending(true);
                      setMessage('Sending a new code…');
                      const res = await fetch('/api/auth/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(data.error || 'Could not resend');
                      setMessage('A new code was sent to your email.');
                    } catch (e: any) {
                      setMessage(e?.message || 'Failed to resend');
                    } finally {
                      setResending(false);
                    }
                  }}
                  className="absolute inset-y-0 right-2 my-auto px-3 h-8 text-sm rounded-[8px] text-black/80 hover:text-black disabled:opacity-50"
                >
                  {resending ? 'Resending…' : 'Resend'}
                </button>
              </div>
              {status === 'error' && !email && (
                <p id="email-error" className="text-red-600 text-sm mt-1">Email is required</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-black">6-digit code</label>
              <div className="flex items-center justify-between gap-2">
                {Array.from({ length: otpLen }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digits[i]}
                    aria-label={`Digit ${i + 1}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0,1);
                      const next = [...digits];
                      next[i] = val;
                      setDigits(next);
                      if (val && i < otpLen - 1) inputsRef.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digits[i] && i > 0) {
                        inputsRef.current[i - 1]?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, otpLen);
                      if (!text) return;
                      e.preventDefault();
                      const next = Array(otpLen).fill('');
                      for (let j = 0; j < text.length; j++) next[j] = text[j];
                      setDigits(next);
                      inputsRef.current[Math.min(text.length, otpLen - 1)]?.focus();
                    }}
                    className="h-12 w-12 sm:h-14 sm:w-14 text-2xl text-center rounded-[10px] border border-gray-300 bg-white/40 focus:outline-none focus:border-black"
                  />
                ))}
              </div>
            </div>
            <button disabled={loading} className="btn-shine relative w-full h-11 px-4 rounded-[10px] bg-black text-white font-medium tracking-wide shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:brightness-110 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black/30">{loading ? 'Verifying…' : 'Verify' }<span aria-hidden className="shine"></span></button>
          </form>

          <div className="text-sm mt-2">{message}</div>
          <div className="mt-2 text-sm text-black/70"><a className="text-black hover:underline" href="/login">Go to login</a></div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}
