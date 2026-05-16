'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { DashboardSearchProvider, useDashboardSearch } from '@/contexts/DashboardSearchContext';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { formatRoleLabel } from '@/lib/roleLabels';

function TrainerHeaderBar({
  userName,
  userRole,
  onOpenMobileSidebar,
}: {
  userName: string;
  userRole: string;
  onOpenMobileSidebar: () => void;
}) {
  const { navFilter, setNavFilter } = useDashboardSearch();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const firstName = userName.split(' ')[0];

  return (
    <header className="sticky top-0 z-20 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-lg">
      <div className="flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-8 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="lg:hidden shrink-0 touch-manipulation rounded-xl border border-[#E5E7EB] bg-white p-2 text-[#0F172A] shadow-sm"
            aria-label="Open menu"
            onClick={onOpenMobileSidebar}
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <h1 className="min-w-0 flex-1 text-base font-bold leading-tight text-[#0F172A] sm:text-xl">
            <span className="block truncate">
              {greeting}, {firstName}
            </span>
          </h1>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/trainer/notifications"
              className="relative touch-manipulation inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-gray-50 p-2 sm:p-2.5 hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                3
              </span>
            </Link>

            <div className="flex items-center gap-1.5 border-l border-[#E5E7EB] pl-1.5 sm:gap-2 sm:pl-3">
              <div className="hidden min-w-0 text-right sm:block">
                <p className="truncate text-sm font-semibold text-[#0F172A] max-w-[10rem] md:max-w-[14rem]">{userName}</p>
                <p className="text-[11px] text-[#6B7280]">{formatRoleLabel(userRole)}</p>
              </div>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 sm:h-10 sm:w-10"
                title={userName}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="touch-manipulation p-2 text-gray-400 hover:text-red-500"
                title="Sign out"
                type="button"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs leading-snug text-[#6B7280] sm:text-sm sm:leading-relaxed">
          Here&apos;s your activity overview for today.
        </p>

        <div className="relative w-full max-w-xl">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            placeholder="Search modules, pages, and shortcuts..."
            value={navFilter}
            onChange={(e) => setNavFilter(e.target.value)}
            className="w-full rounded-2xl border border-[#E5E7EB] bg-white/90 py-2.5 pl-10 pr-4 text-sm text-[#0F172A] placeholder:text-[#6B7280] shadow-sm focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>
    </header>
  );
}

function TrainerLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F7F5' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const userName = (session.user as any)?.name || 'Trainer';
  const userRole = (session.user as any)?.role || 'TRAINER';

  return (
    <div className="min-h-screen" style={{ background: '#F4F7F5' }}>
      <DashboardSidebar isMobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <TrainerHeaderBar
          userName={userName}
          userRole={userRole}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function TrainerRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSearchProvider>
      <TrainerLayoutInner>{children}</TrainerLayoutInner>
    </DashboardSearchProvider>
  );
}
