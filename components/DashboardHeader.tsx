'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  role?: string;
}

export default function DashboardHeader({
  title,
  subtitle,
  showBackButton = false,
  backHref = '/dashboard',
  role,
}: DashboardHeaderProps) {
  const { data: session } = useSession();
  const userName = (session?.user as any)?.name || 'User';
  const userEmail = (session?.user as any)?.email || '';
  const userRole = role || (session?.user as any)?.role;

  const getNavLinks = () => {
    if (userRole === 'TRAINER_ROBOCHAMPS' || userRole === 'TRAINER_SCHOOL') {
      return (
        <>
          <Link
            href="/trainer/attendance"
            className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
          >
            Mark Attendance
          </Link>
          <Link
            href="/trainer/attendance/view"
            className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
          >
            View Attendance
          </Link>
          <Link
            href="/trainer/reports/new"
            className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
          >
            Create Report
          </Link>
          <Link
            href="/trainer/reports"
            className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
          >
            View Reports
          </Link>
          <Link
            href="/trainer/combined-sheet"
            className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
          >
            Combined Sheet
          </Link>
        </>
      );
    } else {
      return (
        <>
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
          {userRole === 'ADMIN' && (
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
          {userRole === 'TEACHER' && (
            <Link
              href="/dashboard/training-report/new"
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
            >
              Training Report
            </Link>
          )}
        </>
      );
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href={userRole === 'TRAINER_ROBOCHAMPS' || userRole === 'TRAINER_SCHOOL' ? '/trainer/dashboard' : '/dashboard'}>
              <img
                src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
                alt="Logo"
                className="h-8 object-contain"
              />
            </Link>
            {showBackButton && (
              <Link
                href={backHref}
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
              >
                ← Back
              </Link>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-4">
              {getNavLinks()}
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
  );
}
