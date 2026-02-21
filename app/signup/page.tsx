'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MinimalInput } from '@/components/ui/MinimalInput';
import { MinimalSelect } from '@/components/ui/MinimalSelect';
import { MinimalButton } from '@/components/ui/MinimalButton';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4 overflow-y-auto">
      <div className="w-full max-w-sm space-y-12 py-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <img
            src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
            alt="Robochamps Logo"
            className="h-12 mx-auto object-contain"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Create account
            </h1>
            <p className="text-gray-500">Join the trainer community</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <MinimalInput
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />

            <MinimalSelect
              label="School Name"
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
            >
              <option value="">
                {loadingSchools ? 'Loading schools...' : schools.length === 0 ? 'No schools available (First user will be admin)' : 'Select a school'}
              </option>
              {schools.map((school) => (
                <option key={school._id} value={school._id}>
                  {school.name} - {school.locationText}
                </option>
              ))}
            </MinimalSelect>
            {schools.length === 0 && !loadingSchools && (
              <p className="text-xs text-gray-500 mt-1">
                No schools available. The first user will become an admin and can add schools later.
              </p>
            )}

            <MinimalInput
              label="Location"
              type="text"
              placeholder={schools.length === 0 ? "Optional for first user (admin)" : "Auto-filled from school selection"}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required={schools.length > 0}
            />

            <MinimalSelect
              label="Trainer Type"
              required={schools.length > 0}
              value={formData.trainerType}
              onChange={(e) => setFormData({ ...formData, trainerType: e.target.value as 'ROBOCHAMPS' | 'SCHOOL' })}
              disabled={schools.length === 0}
            >
              <option value="SCHOOL">School Trainer</option>
              <option value="ROBOCHAMPS">Robochamps Trainer</option>
            </MinimalSelect>
            {schools.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Trainer type not required for first user (admin)
              </p>
            )}

            <MinimalInput
              label="Email Address"
              type="email"
              placeholder="trainer@robochamps.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <MinimalInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 -mt-4">Minimum 6 characters</p>
          </div>

          <div className="space-y-4">
            <MinimalButton type="submit" fullWidth disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </MinimalButton>

            <div className="text-center">
              <span className="text-gray-500 text-sm">
                Already have an account?{' '}
              </span>
              <Link
                href="/login"
                className="text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
