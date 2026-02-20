'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface School {
  _id: string;
  name: string;
  locationText: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    schoolId: '',
    location: '',
    trainerType: 'SCHOOL' as 'ROBOCHAMPS' | 'SCHOOL',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      if (response.ok) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error message
        let errorMsg = data.error || 'Signup failed';
        if (data.details && Array.isArray(data.details)) {
          const detailMsg = data.details.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message}`).join(', ');
          errorMsg = `${errorMsg}. ${detailMsg}`;
        }
        throw new Error(errorMsg);
      }

      // Redirect to login
      router.push('/login?message=' + encodeURIComponent(data.message || 'Account created successfully'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 flex items-start justify-center p-4 sm:p-6 bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1f3a] overflow-y-auto">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-white/10 my-auto">
        <div className="flex justify-center mb-8">
          <img
            src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
            alt="Robochamps Logo"
            className="h-20 w-auto object-contain"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 sm:mb-3 text-white">
          Create Account
        </h1>
        <p className="text-center text-white/80 mb-6 sm:mb-8 lg:mb-10 text-base sm:text-lg">
          Join our ERP system
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 text-red-300 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              School Name *
            </label>
            <select
              required={schools.length > 0}
              value={formData.schoolId}
              onChange={(e) => {
                const selectedSchool = schools.find(s => s._id === e.target.value);
                setFormData({ 
                  ...formData, 
                  schoolId: e.target.value,
                  location: selectedSchool?.locationText || ''
                });
              }}
              disabled={loadingSchools}
              className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white focus:outline-none transition-all"
            >
              <option value="" className="bg-gray-900">{loadingSchools ? 'Loading schools...' : schools.length === 0 ? 'No schools available (First user will be admin)' : 'Select a school'}</option>
              {schools.map((school) => (
                <option key={school._id} value={school._id} className="bg-gray-900">
                  {school.name} - {school.locationText}
                </option>
              ))}
            </select>
            {schools.length === 0 && !loadingSchools && (
              <p className="text-xs text-white/60 mt-2">
                No schools available. The first user will become an admin and can add schools later.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Location *
            </label>
            <input
              type="text"
              required={schools.length > 0}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all"
              placeholder={schools.length === 0 ? "Optional for first user (admin)" : "Auto-filled from school selection"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Trainer Type *
            </label>
            <select
              required={schools.length > 0}
              value={formData.trainerType}
              onChange={(e) => setFormData({ ...formData, trainerType: e.target.value as 'ROBOCHAMPS' | 'SCHOOL' })}
              disabled={schools.length === 0}
              className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="SCHOOL" className="bg-gray-900">School Trainer</option>
              <option value="ROBOCHAMPS" className="bg-gray-900">Robochamps Trainer</option>
            </select>
            {schools.length === 0 && (
              <p className="text-xs text-white/60 mt-2">
                Trainer type not required for first user (admin)
              </p>
            )}
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
              className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all"
              placeholder="Enter your email"
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
              className="w-full px-5 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all"
              placeholder="Enter your password"
            />
            <p className="text-xs text-white/60 mt-2">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-900 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/80">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
