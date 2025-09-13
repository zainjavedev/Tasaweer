'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Page() {
  const sp = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending'|'ok'|'error'>('pending');
  const [message, setMessage] = useState('Verifying…');

  useEffect(() => {
    const token = sp.get('token');
    if (!token) { setStatus('error'); setMessage('Missing token'); return; }
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Verify failed');
        setStatus('ok'); setMessage('Email verified! You may now sign in.');
        setTimeout(() => router.replace('/login'), 1200);
      } catch (e: any) {
        setStatus('error'); setMessage(e?.message || 'Verification failed');
      }
    })();
  }, [sp, router]);

  return (
    <div className={`max-w-sm mx-auto p-6 rounded-xl border ${status === 'error' ? 'bg-red-50' : 'bg-card'}`}>
      <div className="text-sm">{message}</div>
      {status !== 'pending' && (
        <div className="mt-3 text-xs text-muted-foreground">
          <a className="text-primary underline" href="/login">Go to login</a>
        </div>
      )}
    </div>
  );
}

