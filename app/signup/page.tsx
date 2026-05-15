'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MinimalInput } from '@/components/ui/MinimalInput';
import { MinimalSelect } from '@/components/ui/MinimalSelect';
import { MinimalButton } from '@/components/ui/MinimalButton';
import PublicPageLayout from '@/components/landing/PublicPageLayout';

interface School {
  _id: string;
  name: string;
  locationText: string;
  schoolCode: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    schoolCode: '',
    schoolId: '',
    location: '',
    trainerType: 'SCHOOL' as 'ROBOCHAMPS' | 'SCHOOL',
    email: '',
    password: '',
  });
  const [schoolCodeError, setSchoolCodeError] = useState('');
  const [loadingSchoolCode, setLoadingSchoolCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      if (response.ok) setSchools(data.schools || []);
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleSchoolCodeChange = async (code: string) => {
    setFormData({ ...formData, schoolCode: code.toUpperCase() });
    setSchoolCodeError('');

    if (!code || code.trim().length === 0) {
      setFormData((prev) => ({ ...prev, schoolCode: '', schoolId: '', location: '' }));
      return;
    }

    if (code.trim().length < 2) return;

    setLoadingSchoolCode(true);
    try {
      const response = await fetch(`/api/schools/by-code?code=${encodeURIComponent(code.toUpperCase().trim())}`);
      const data = await response.json();

      if (response.ok && data.school) {
        setFormData((prev) => ({
          ...prev,
          schoolId: data.school._id,
          location: data.school.locationText,
          schoolCode: data.school.schoolCode,
        }));
        setSchoolCodeError('');
      } else {
        setSchoolCodeError('School not found with this code');
        setFormData((prev) => ({ ...prev, schoolId: '', location: '' }));
      }
    } catch {
      setSchoolCodeError('Failed to lookup school code');
      setFormData((prev) => ({ ...prev, schoolId: '', location: '' }));
    } finally {
      setLoadingSchoolCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (schools.length > 0 && !formData.schoolCode) {
      setError('School code is required');
      return;
    }

    if (schools.length > 0 && !formData.schoolId) {
      setError('Please enter a valid school code');
      return;
    }

    setLoading(true);

    try {
      const { schoolCode, ...submitData } = formData;
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || 'Signup failed';
        if (data.details && Array.isArray(data.details)) {
          const detailMsg = data.details
            .map((d: { path?: string[]; message: string }) => `${d.path?.join('.') || 'field'}: ${d.message}`)
            .join(', ');
          errorMsg = `${errorMsg}. ${detailMsg}`;
        }
        throw new Error(errorMsg);
      }

      router.push('/login?message=' + encodeURIComponent(data.message || 'Account created successfully'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicPageLayout mainClassName="flex-1 px-4 py-28 sm:py-32">
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md shadow-xl shadow-emerald-500/5 p-8 sm:p-10">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Create account</h1>
            <p className="text-[#6B7280] text-sm">Join the trainer community</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <MinimalInput
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />

              <div>
                <MinimalInput
                  label="School Code"
                  type="text"
                  placeholder="Enter school code (e.g., ABC001)"
                  value={formData.schoolCode}
                  onChange={(e) => handleSchoolCodeChange(e.target.value)}
                  required={schools.length > 0}
                  style={{ textTransform: 'uppercase', color: '#111827' }}
                />
                {loadingSchoolCode && <p className="text-xs text-[#6B7280] mt-1">Looking up school...</p>}
                {schoolCodeError && <p className="text-xs text-red-500 mt-1">{schoolCodeError}</p>}
                {formData.schoolId && !schoolCodeError && (
                  <p className="text-xs text-emerald-600 mt-1">School found and auto-filled</p>
                )}
                {schools.length > 0 && !formData.schoolId && (
                  <p className="text-xs text-[#6B7280] mt-1">Enter your school code to auto-fill school details</p>
                )}
              </div>

              <MinimalSelect
                label="School Name"
                required={schools.length > 0 && !formData.schoolId}
                value={formData.schoolId}
                onChange={(e) => {
                  const selectedSchool = schools.find((s) => s._id === e.target.value);
                  setFormData({
                    ...formData,
                    schoolId: e.target.value,
                    location: selectedSchool?.locationText || '',
                    schoolCode: selectedSchool?.schoolCode || '',
                  });
                }}
                disabled={loadingSchools || (!!formData.schoolCode && formData.schoolCode.trim().length > 0)}
              >
                <option value="">
                  {loadingSchools
                    ? 'Loading schools...'
                    : schools.length === 0
                      ? 'No schools available (First user will be admin)'
                      : formData.schoolId
                        ? 'Auto-selected from code'
                        : 'Or select a school manually'}
                </option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name} - {school.locationText} {school.schoolCode ? `(${school.schoolCode})` : ''}
                  </option>
                ))}
              </MinimalSelect>
              {schools.length === 0 && !loadingSchools && (
                <p className="text-xs text-[#6B7280] -mt-3">
                  No schools available. The first user will become an admin and can add schools later.
                </p>
              )}

              <MinimalInput
                label="Location"
                type="text"
                placeholder={
                  schools.length === 0
                    ? 'Optional for first user (admin)'
                    : formData.schoolCode
                      ? 'Auto-filled from school code'
                      : 'Auto-filled from school selection'
                }
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required={schools.length > 0}
                disabled={!!formData.schoolCode && formData.schoolCode.trim().length > 0}
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
                <p className="text-xs text-[#6B7280] -mt-3">Trainer type not required for first user (admin)</p>
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
              <p className="text-xs text-[#6B7280] -mt-3">Minimum 6 characters</p>
            </div>

            <div className="space-y-4">
              <MinimalButton type="submit" fullWidth disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </MinimalButton>
              <p className="text-center text-sm text-[#6B7280]">
                Already have an account?{' '}
                <Link href="/login" className="text-emerald-600 font-semibold hover:text-emerald-700">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </PublicPageLayout>
  );
}
