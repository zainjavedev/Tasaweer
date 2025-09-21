'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Shield, BarChart3, KeyRound, Search } from 'lucide-react';
import { Fredoka } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { useUser } from '@/utils/useUser';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['400','500','600','700'] });

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  imageCount: number;
  imageLimit: number | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  generations: Array<{
    id: string;
    type: string;
    createdAt: Date;
  }>;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetPasswordFor, setResetPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    // Wait until user state finishes loading to avoid premature redirects
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [user, loading, router]);

  useEffect(() => {
    const filtered = users.filter(u =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');

      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetPasswordFor || !newPassword) return;

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetPasswordFor,
          newPassword
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed');

      setResetSuccess('Password updated successfully');
      setNewPassword('');
      setTimeout(() => {
        setResetPasswordFor(null);
        setResetSuccess(null);
      }, 3000);
    } catch (e: any) {
      setResetError(e?.message || 'Password reset failed');
    } finally {
      setResetLoading(false);
    }
  };

  const getGenerationTypes = (generations: User['generations']) => {
    const types = [...new Set(generations.map(g => g.type))];
    return types.length > 0 ? types.join(', ') : 'None';
  };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return <div className="min-h-screen flex items-center justify-center">Access denied</div>;
  }

  if (usersLoading) {
    return (
      <div className={`${fredoka.className} min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fredoka.className} min-h-screen bg-gray-50 p-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-black" />
            <h1 className="text-3xl font-medium text-black">Admin Dashboard</h1>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/60" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 rounded-[8px] border border-gray-300 bg-white/40 pl-10 pr-12 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-black/50 transition hover:text-black"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black/70">Total Users</p>
                <p className="text-2xl font-bold text-black">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-black" />
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black/70">Verified Users</p>
                <p className="text-2xl font-bold text-black">{users.filter(u => u.emailVerifiedAt).length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-black" />
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black/70">Admin Users</p>
                <p className="text-2xl font-bold text-black">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
              <Shield className="w-8 h-8 text-black" />
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black/70">Total Generations</p>
                <p className="text-2xl font-bold text-black">
                  {users.reduce((acc, u) => acc + u.generations.length, 0)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-black" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-xl font-medium text-black">Users Management</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">User</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">Usage</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">Generations</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-black">{u.username}</div>
                        <div className="text-sm text-black/70">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-black">
                          {u.imageCount}/{u.imageLimit ?? '∞'}
                        </div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-black rounded-full"
                            style={{ width: `${getUsagePercentage(u.imageCount, u.imageLimit)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black">
                        {getGenerationTypes(u.generations)}
                      </div>
                      <div className="text-xs text-black/60">
                        {u.generations.length} generations
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        u.emailVerifiedAt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.emailVerifiedAt ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setResetPasswordFor(u.id);
                          setResetError(null);
                          setResetSuccess(null);
                          setNewPassword('');
                        }}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-black text-white rounded-md hover:bg-black/80"
                      >
                        <KeyRound className="w-4 h-4" />
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Password Reset Modal */}
        {resetPasswordFor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white/40 backdrop-blur-xl rounded-[12px] border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6 max-w-md w-full">
              <h3 className="text-xl font-medium text-black mb-4">Reset Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 rounded-[8px] border border-gray-300 bg-white/40 px-3 pr-12 text-gray-900 placeholder:text-black/50 focus:border-black focus:outline-none"
                      placeholder="Enter new password"
                    />
                    {newPassword && (
                      <button
                        type="button"
                        onClick={() => setNewPassword('')}
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-black/50 transition hover:text-black"
                        aria-label="Clear new password"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {resetError && (
                  <div className="text-sm text-red-600 bg-red-50/80 p-2 rounded-md">
                    {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="text-sm text-green-600 bg-green-50/80 p-2 rounded-md">
                    {resetSuccess}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handlePasswordReset}
                    disabled={resetLoading || !newPassword}
                    className="btn-shine relative flex-1 h-10 px-4 rounded-[8px] bg-black text-white font-medium tracking-wide shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:brightness-110 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black/30"
                  >
                    {resetLoading ? 'Updating...' : 'Update Password'}
                    <span aria-hidden className="shine"></span>
                  </button>

                  <button
                    onClick={() => {
                      setResetPasswordFor(null);
                      setResetError(null);
                      setResetSuccess(null);
                    }}
                    className="flex-1 h-10 px-4 rounded-[8px] border border-gray-300 bg-white/40 text-black hover:bg-black/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
