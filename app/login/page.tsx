'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MinimalInput } from '@/components/ui/MinimalInput';
import { MinimalButton } from '@/components/ui/MinimalButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg) {
      setMessage(decodeURIComponent(msg));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error('Login error:', result.error);
        // Check if it's a configuration issue
        if (result.error.includes('configuration') || result.error.includes('NEXTAUTH')) {
          setError('Authentication configuration error. Please contact administrator.');
        } else {
          setError('Invalid email or password. Please check your credentials.');
        }
        return;
      }

      // Redirect based on role
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm space-y-12">
        {/* Header */}
        <div className="text-center space-y-6">
          <img
            src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
            alt="Robochamps Logo"
            className="h-12 mx-auto object-contain"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-gray-500">Sign in to access your dashboard</p>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <MinimalInput
              label="Email Address"
              type="email"
              placeholder="trainer@robochamps.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={error && error.includes('email') ? error : undefined}
            />
            <MinimalInput
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              error={error && error.includes('password') ? error : undefined}
            />
          </div>

          <div className="space-y-4">
            <MinimalButton type="submit" fullWidth disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </MinimalButton>

            <div className="text-center">
              <span className="text-gray-500 text-sm">
                Don't have an account?{' '}
              </span>
              <Link
                href="/signup"
                className="text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: '#1b1d1e' }}>
        <div className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-white/10">
          <div className="text-center text-white">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
