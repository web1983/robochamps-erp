'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MinimalInput } from '@/components/ui/MinimalInput';
import { MinimalButton } from '@/components/ui/MinimalButton';
import PublicPageLayout from '@/components/landing/PublicPageLayout';

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
    if (msg) setMessage(decodeURIComponent(msg));
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
        if (result.error.includes('configuration') || result.error.includes('NEXTAUTH')) {
          setError('Authentication configuration error. Please contact administrator.');
        } else {
          setError('Invalid email or password. Please check your credentials.');
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md shadow-xl shadow-emerald-500/5 p-8 sm:p-10">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Welcome back</h1>
          <p className="text-[#6B7280] text-sm">Sign in to access your dashboard</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
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
            <p className="text-center text-sm text-[#6B7280]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-emerald-600 font-semibold hover:text-emerald-700">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PublicPageLayout>
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-10 animate-pulse h-96" />
        }
      >
        <LoginForm />
      </Suspense>
    </PublicPageLayout>
  );
}
