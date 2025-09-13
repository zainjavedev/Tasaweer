'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '@/utils/authClient';

export default function Page() {
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
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
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (!data.token) throw new Error('No token returned');
      setToken(data.token);
      router.replace('/');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign in</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Sign in with your email or username. Email verification is required.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email or Username</label>
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full p-2 rounded-md border bg-white dark:bg-gray-700" />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 rounded-md border bg-white dark:bg-gray-700" />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</div>}
        <button disabled={loading} className="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:bg-purple-300">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        No account? <a href="/register" className="text-purple-700 dark:text-purple-300 underline">Create one</a>.
      </div>
    </div>
  );
}
