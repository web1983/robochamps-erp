'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import MeetingLinksSection from '@/components/MeetingLinksSection';

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
        router.push('/trainer/dashboard');
        return;
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-8">
                <img
                  src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
                  alt="Logo"
                  className="h-8 object-contain"
                />
              </div>
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return null;
  }

  const role = (session.user as any)?.role;
  if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
    return null;
  }

  const userName = (session?.user as any)?.name || (role === 'ADMIN' ? 'Admin' : 'Teacher');
  const userEmail = (session?.user as any)?.email || '';

  const features = [
    ...(role === 'TEACHER' ? [{
      title: 'Training Report',
      description: 'Submit daily training report for trainers.',
      icon: '📚',
      action: 'Create Report',
      href: '/dashboard/training-report/new',
    }] : []),
    {
      title: 'View Reports',
      description: 'View all trainer and teacher reports.',
      icon: '📊',
      action: 'Browse All',
      href: '/dashboard/reports',
    },
    {
      title: 'Attendance',
      description: 'View and export attendance records.',
      icon: '✅',
      action: 'View Records',
      href: '/dashboard/attendance',
    },
    {
      title: 'Combined Sheet',
      description: 'View attendance and reports together.',
      icon: '📋',
      action: 'View Sheet',
      href: '/dashboard/combined-records',
    },
    ...(role === 'ADMIN' ? [
      {
        title: 'User Management',
        description: 'Create and manage users and admins.',
        icon: '👥',
        action: 'Manage Users',
        href: '/dashboard/users',
      },
      {
        title: 'Schools',
        description: 'Manage schools and locations.',
        icon: '🏫',
        action: 'Manage Schools',
        href: '/dashboard/schools',
      },
      {
        title: 'Meeting Links',
        description: 'Manage meeting links and track clicks.',
        icon: '🔗',
        action: 'Manage Links',
        href: '/dashboard/meeting-links',
      },
      {
        title: 'Uploaded Sheets',
        description: 'View and filter uploaded signed combined sheets.',
        icon: '📄',
        action: 'View Sheets',
        href: '/dashboard/uploaded-sheets',
      },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <img
                src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
                alt="Logo"
                className="h-8 object-contain"
              />
            </div>

            <div className="flex items-center gap-6">
              {/* Navigation Links */}
              <div className="hidden lg:flex items-center gap-4">
                <Link
                  href="/dashboard/reports"
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Reports
                </Link>
                <Link
                  href="/dashboard/attendance"
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Attendance
                </Link>
                <Link
                  href="/dashboard/combined-records"
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Combined Sheet
                </Link>
                {role === 'ADMIN' && (
                  <>
                    <Link
                      href="/dashboard/users"
                      className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                    >
                      Users
                    </Link>
                    <Link
                      href="/dashboard/schools"
                      className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                    >
                      Schools
                    </Link>
                    <Link
                      href="/dashboard/meeting-links"
                      className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                    >
                      Meeting Links
                    </Link>
                  </>
                )}
                {role === 'TEACHER' && (
                  <Link
                    href="/dashboard/training-report/new"
                    className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
                  >
                    Training Report
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                  <span className="text-gray-600 text-sm">👤</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors border border-gray-200 rounded hover:border-red-300"
                  title="Sign out"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Good morning, {userName.split(' ')[0]}
          </h1>
          <p className="text-lg text-gray-500">
            {role === 'ADMIN' ? 'Manage your ERP system efficiently.' : 'Welcome back! Manage your training reports.'}
          </p>
        </div>

        <MeetingLinksSection />

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Link
              key={index}
              href={feature.href}
              className="group bg-white p-8 border border-gray-100 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-sm cursor-pointer relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

              <div className="text-4xl mb-6">{feature.icon}</div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {feature.title}
              </h3>

              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                {feature.description}
              </p>

              <div className="flex items-center text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {feature.action}
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
          <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center gap-8">
                  <img
                    src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
                    alt="Logo"
                    className="h-8 object-contain"
                  />
                </div>
              </div>
            </div>
          </nav>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
