'use client';

import React, { useState, useEffect } from 'react';
import { AtSign, KeyRound, BarChart3, User } from 'lucide-react';
import { Fredoka } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useUser } from '@/utils/useUser';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400','500','600','700'] });

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, refreshUserData } = useUser();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // In a real app, you'd fetch the user's email from the server
    // For now, we'll use a placeholder email
    setEmail('user@example.com'); // This should come from the user data
  }, [user, router]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Password reset failed');

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`${fredoka.className} relative w-full min-h-screen bg-gray-50`}>
      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-black" />
                <h2 className="text-xl font-medium text-black">Profile Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      value={user.username || ''}
                      readOnly
                      className="w-full h-10 pl-10 pr-3 rounded-[8px] border border-gray-300 bg-white/40 text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                      <AtSign className="w-4 h-4" />
                    </span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 rounded-[8px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="lg:col-span-1">
            <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6 text-black" />
                <h2 className="text-xl font-medium text-black">Usage Statistics</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-black mb-2">Image Usage</div>
                  <div className="text-2xl font-bold text-black">
                    {user.imageCount || 0} / {user.imageLimit ?? '∞'}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-black h-2 rounded-full"
                      style={{
                        width: user.imageLimit && user.imageLimit > 0
                          ? `${Math.min((user.imageCount || 0) / user.imageLimit * 100, 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-black mb-2">Account Type</div>
                  <div className="text-lg font-semibold text-black uppercase">
                    {user.role || 'FREE'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Reset */}
          <div className="lg:col-span-1">
            <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <KeyRound className="w-6 h-6 text-black" />
                <h2 className="text-xl font-medium text-black">Reset Password</h2>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Current Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-10 pl-10 pr-10 rounded-[8px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({...p, current: !p.current}))}
                      className="absolute inset-y-0 right-2 text-black/60 hover:text-black"
                    >
                      {showPasswords.current ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 pl-10 pr-10 rounded-[8px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({...p, new: !p.new}))}
                      className="absolute inset-y-0 right-2 text-black/60 hover:text-black"
                    >
                      {showPasswords.new ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-black/60">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-10 pl-10 pr-10 rounded-[8px] border border-gray-300 bg-white/40 placeholder:text-black/50 focus:outline-none focus:border-black text-gray-900"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(p => ({...p, confirm: !p.confirm}))}
                      className="absolute inset-y-0 right-2 text-black/60 hover:text-black"
                    >
                      {showPasswords.confirm ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50/80 p-2 rounded-md">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-sm text-green-600 bg-green-50/80 p-2 rounded-md">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-shine relative w-full h-10 px-4 rounded-[8px] bg-black text-white font-medium tracking-wide shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:brightness-110 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black/30"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                  <span aria-hidden className="shine"></span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}