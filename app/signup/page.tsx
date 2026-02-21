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
  schoolCode?: string;
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
      if (response.ok) {
        setSchools(data.schools || []);
      }
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
      // Clear school selection if code is empty
      setFormData(prev => ({ ...prev, schoolCode: '', schoolId: '', location: '' }));
      return;
    }

    if (code.trim().length < 2) {
      return; // Wait for more characters
    }

    setLoadingSchoolCode(true);
    try {
      const response = await fetch(`/api/schools/by-code?code=${encodeURIComponent(code.toUpperCase().trim())}`);
      const data = await response.json();

      if (response.ok && data.school) {
        // Auto-fill school name and location
        setFormData(prev => ({
          ...prev,
          schoolId: data.school._id,
          location: data.school.locationText,
          schoolCode: data.school.schoolCode,
        }));
        setSchoolCodeError('');
      } else {
        setSchoolCodeError('School not found with this code');
        setFormData(prev => ({ ...prev, schoolId: '', location: '' }));
      }
    } catch (err) {
      setSchoolCodeError('Failed to lookup school code');
      setFormData(prev => ({ ...prev, schoolId: '', location: '' }));
    } finally {
      setLoadingSchoolCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Don't send schoolCode to API, only send schoolId
      const { schoolCode, ...submitData } = formData;
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
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

            <div>
              <MinimalInput
                label="School Code (Optional)"
                type="text"
                placeholder="Enter school code (e.g., ABC001)"
                value={formData.schoolCode}
                onChange={(e) => handleSchoolCodeChange(e.target.value)}
                style={{ textTransform: 'uppercase' }}
              />
              {loadingSchoolCode && (
                <p className="text-xs text-gray-500 mt-1">Looking up school...</p>
              )}
              {schoolCodeError && (
                <p className="text-xs text-red-500 mt-1">{schoolCodeError}</p>
              )}
              {formData.schoolId && !schoolCodeError && (
                <p className="text-xs text-emerald-600 mt-1">✓ School found and auto-filled</p>
              )}
            </div>

            <MinimalSelect
              label="School Name"
              required={schools.length > 0 && !formData.schoolId}
              value={formData.schoolId}
              onChange={(e) => {
                const selectedSchool = schools.find(s => s._id === e.target.value);
                setFormData({ 
                  ...formData, 
                  schoolId: e.target.value,
                  location: selectedSchool?.locationText || '',
                  schoolCode: selectedSchool?.schoolCode || ''
                });
              }}
              disabled={loadingSchools || (!!formData.schoolCode && formData.schoolCode.trim().length > 0)}
            >
              <option value="">
                {loadingSchools ? 'Loading schools...' : schools.length === 0 ? 'No schools available (First user will be admin)' : formData.schoolId ? 'Auto-selected from code' : 'Or select a school manually'}
              </option>
              {schools.map((school) => (
                <option key={school._id} value={school._id}>
                  {school.name} - {school.locationText} {school.schoolCode ? `(${school.schoolCode})` : ''}
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
              placeholder={schools.length === 0 ? "Optional for first user (admin)" : formData.schoolCode ? "Auto-filled from school code" : "Auto-filled from school selection"}
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
