'use client';

import React, { useState } from 'react';

export default function Page() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, username, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setDone(true);
    } catch (e: any) { setError(e?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  if (!process.env.NEXT_PUBLIC_ALLOW_REGISTER && !process.env.DATABASE_URL) {
    return <div className="max-w-sm mx-auto p-6 rounded-xl border bg-card">Registration requires database mode.</div>;
  }

  return (
    <div className="max-w-sm mx-auto p-6 rounded-xl border bg-card space-y-4">
      <h2 className="text-lg font-semibold">Create account</h2>
      {done ? (
        <div className="text-sm text-foreground/80">Check your email for a verification link.</div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input type="email" className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && (<div role="alert" className="rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>)}
          <button disabled={loading} className="w-full px-3 py-2 rounded-md border text-sm font-semibold hover:bg-accent disabled:opacity-60">{loading ? 'Creating…' : 'Create account'}</button>
        </form>
      )}
      <div className="text-xs text-muted-foreground">Already have an account? <a href="/login" className="text-primary underline">Sign in</a></div>
    </div>
  );
}

