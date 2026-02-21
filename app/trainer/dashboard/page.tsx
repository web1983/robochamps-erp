'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import MeetingLinksSection from '@/components/MeetingLinksSection';

function TrainerDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
        router.push('/dashboard');
        return;
      }

      // Check for success message
      const success = searchParams.get('success');
      if (success) {
        setSuccessMessage(decodeURIComponent(success));
        setShowSuccess(true);
        // Remove success param from URL
        router.replace('/trainer/dashboard');
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      }
    }
  }, [status, session, router, searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1b1d1e' }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return null;
  }

  const role = (session.user as any)?.role;
  if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1b1d1e' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Trainer Dashboard
        </h1>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-400 font-semibold">{successMessage}</p>
          </div>
        )}

        <MeetingLinksSection />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/trainer/attendance"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-blue-500/50 hover:border-blue-500"
          >
            <div className="text-4xl mb-4">📸</div>
            <h2 className="text-xl font-semibold mb-2 text-white">Mark Attendance</h2>
            <p className="text-white/80">Take a photo and mark your class attendance</p>
          </Link>

          <Link
            href="/trainer/attendance/view"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-cyan-500/50 hover:border-cyan-500"
          >
            <div className="text-4xl mb-4">👁️</div>
            <h2 className="text-xl font-semibold mb-2 text-white">View Attendance</h2>
            <p className="text-white/80">See all your marked attendance records</p>
          </Link>

          <Link
            href="/trainer/reports/new"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-green-500/50 hover:border-green-500"
          >
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2 text-white">Create Report</h2>
            <p className="text-white/80">Submit your daily class report</p>
          </Link>

          <Link
            href="/trainer/reports"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-purple-500/50 hover:border-purple-500"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2 text-white">View Reports</h2>
            <p className="text-white/80">See all your submitted reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TrainerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ backgroundColor: '#1b1d1e' }}>
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <TrainerDashboardContent />
    </Suspense>
  );
}
