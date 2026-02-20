'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1f3a]">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-white/10">
        <div className="flex justify-center mb-8">
          <img
            src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
            alt="Robochamps Logo"
            className="h-20 w-auto object-contain"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 sm:mb-3 text-white">
          Welcome Back
        </h1>
        <p className="text-center text-white/80 mb-6 sm:mb-8 lg:mb-10 text-base sm:text-lg">
          Login to your ERP account
        </p>

        {message && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-400/50 text-green-300 rounded-xl">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400/50 text-red-300 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 text-base bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all touch-manipulation"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 text-base bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-white/40 text-white placeholder-white/50 focus:outline-none transition-all touch-manipulation"
              placeholder="Enter your password"
              />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-gray-900 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base sm:text-lg touch-manipulation active:scale-95"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 sm:mt-8 text-center text-sm text-white/80">
          Don't have an account?{' '}
          <Link href="/signup" className="text-white font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1f3a]">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 border border-white/10">
          <div className="text-center text-white">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
