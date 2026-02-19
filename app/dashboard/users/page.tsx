'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
  trainerType?: string;
  createdAt: string;
}

interface School {
  _id: string;
  name: string;
}

export default function UsersPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [changingPasswordUserId, setChangingPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TRAINER_SCHOOL' as 'ADMIN' | 'TEACHER' | 'TRAINER_ROBOCHAMPS' | 'TRAINER_SCHOOL',
    schoolId: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      if (response.ok) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.schoolId && (formData.role === 'TRAINER_ROBOCHAMPS' || formData.role === 'TRAINER_SCHOOL')) {
        payload.schoolId = formData.schoolId;
      }

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Reset form and refresh list
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'TRAINER_SCHOOL',
        schoolId: '',
      });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setDeletingUserId(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!changingPasswordUserId) return;

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/users/${changingPasswordUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setChangingPasswordUserId(null);
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/30 text-red-300 border-red-400/50';
      case 'TEACHER':
        return 'bg-blue-500/30 text-blue-300 border-blue-400/50';
      case 'TRAINER_ROBOCHAMPS':
        return 'bg-purple-500/30 text-purple-300 border-purple-400/50';
      case 'TRAINER_SCHOOL':
        return 'bg-green-500/30 text-green-300 border-green-400/50';
      default:
        return 'bg-gray-500/30 text-gray-300 border-gray-400/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1f3a]">
        <Navbar />
        <div className="max-w-[95%] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1f3a]">
      <Navbar />
      <div className="max-w-[95%] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8 lg:mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">User Management</h1>
            <p className="text-white/80 text-sm sm:text-base lg:text-lg">Create and manage users and admins</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full sm:w-auto bg-white text-gray-900 px-6 sm:px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 touch-manipulation"
          >
            {showCreateForm ? 'Cancel' : '+ Create User'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="bg-white/5 backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl mb-6 sm:mb-8 lg:mb-10 border border-white/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Create New User</h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 text-base bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all touch-manipulation"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 text-base bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all touch-manipulation"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 sm:px-5 py-3 text-base bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all touch-manipulation"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any, schoolId: '' })}
                    className="w-full px-4 sm:px-5 py-3 text-base bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white focus:outline-none transition-all touch-manipulation"
                  >
                    <option value="ADMIN" className="bg-gray-900">Admin</option>
                    <option value="TEACHER" className="bg-gray-900">Teacher</option>
                    <option value="TRAINER_ROBOCHAMPS" className="bg-gray-900">Robochamps Trainer</option>
                    <option value="TRAINER_SCHOOL" className="bg-gray-900">School Trainer</option>
                  </select>
                </div>

                {(formData.role === 'TRAINER_ROBOCHAMPS' || formData.role === 'TRAINER_SCHOOL') && (
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      School *
                    </label>
                    <select
                      required
                      value={formData.schoolId}
                      onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                      className="w-full px-4 sm:px-5 py-3 text-base bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white focus:outline-none transition-all touch-manipulation"
                    >
                      <option value="" className="bg-gray-900">Select a school</option>
                      {schools.map((school) => (
                        <option key={school._id} value={school._id} className="bg-gray-900">
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95 touch-manipulation"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      name: '',
                      email: '',
                      password: '',
                      role: 'TRAINER_SCHOOL',
                      schoolId: '',
                    });
                    setError('');
                  }}
                  className="w-full sm:w-auto bg-white/10 border border-white/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-white/20 transition-all active:scale-95 touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/10">
            <h2 className="text-xl sm:text-2xl font-bold text-white">All Users ({users.length})</h2>
          </div>
          {users.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-white/70 text-base sm:text-lg">No users found. Create your first user to get started.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/5 divide-y divide-white/10">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{user.name}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="text-sm text-white/80 break-words">{user.email}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <span className={`px-2 lg:px-3 py-1 rounded-lg text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="text-sm text-white/70">{user.schoolName || 'N/A'}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="text-sm text-white/70">{format(new Date(user.createdAt), 'PP')}</div>
                        </td>
                        <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setChangingPasswordUserId(user._id)}
                              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold border border-blue-400/50 transition-all touch-manipulation active:scale-95"
                              disabled={submitting}
                            >
                              Change Password
                            </button>
                            {currentUserId !== user._id && (
                              <button
                                onClick={() => setDeletingUserId(user._id)}
                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold border border-red-400/50 transition-all touch-manipulation active:scale-95"
                                disabled={submitting}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-white/10">
                {users.map((user) => (
                  <div key={user._id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-white mb-1">{user.name}</h3>
                        <p className="text-sm text-white/80 break-words">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ml-2 ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex items-center text-white/70">
                        <span className="font-medium mr-2">School:</span>
                        <span>{user.schoolName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-white/70">
                        <span className="font-medium mr-2">Created:</span>
                        <span>{format(new Date(user.createdAt), 'PP')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/10">
                      <button
                        onClick={() => setChangingPasswordUserId(user._id)}
                        className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm font-semibold border border-blue-400/50 transition-all touch-manipulation active:scale-95"
                        disabled={submitting}
                      >
                        Change Password
                      </button>
                      {currentUserId !== user._id && (
                        <button
                          onClick={() => setDeletingUserId(user._id)}
                          className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-semibold border border-red-400/50 transition-all touch-manipulation active:scale-95"
                          disabled={submitting}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deletingUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Confirm Delete</h3>
              <p className="text-white/80 mb-6">
                Are you sure you want to delete <strong className="text-white">{users.find(u => u._id === deletingUserId)?.name}</strong>? 
                This action cannot be undone.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 text-red-300 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleDelete(deletingUserId)}
                  disabled={submitting}
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setDeletingUserId(null);
                    setError('');
                  }}
                  disabled={submitting}
                  className="flex-1 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all touch-manipulation active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {changingPasswordUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Change Password</h3>
              <p className="text-white/80 mb-6">
                Enter new password for <strong className="text-white">{users.find(u => u._id === changingPasswordUserId)?.name}</strong>
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 text-red-300 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 text-base bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all touch-manipulation"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={submitting || !newPassword || newPassword.length < 6}
                  className="flex-1 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95"
                >
                  {submitting ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setChangingPasswordUserId(null);
                    setNewPassword('');
                    setError('');
                  }}
                  disabled={submitting}
                  className="flex-1 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all touch-manipulation active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
