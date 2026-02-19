'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session) return null;

  const navLinks = role === 'ADMIN' || role === 'TEACHER' ? (
    <>
      <Link href="/dashboard" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/dashboard' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
        Dashboard
      </Link>
      <Link href="/dashboard/reports" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/dashboard/reports' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
        Reports
      </Link>
      <Link href="/dashboard/attendance" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/dashboard/attendance' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
        Attendance
      </Link>
      <Link href="/dashboard/combined-records" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/dashboard/combined-records' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
        Combined Sheet
      </Link>
      {role === 'ADMIN' && (
        <>
          <Link href="/dashboard/users" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/dashboard/users' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
            Users
          </Link>
          <Link href="/dashboard/schools" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/dashboard/schools' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
            Schools
          </Link>
          <Link href="/dashboard/meeting-links" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/dashboard/meeting-links' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
            Meeting Links
          </Link>
        </>
      )}
    </>
  ) : (
    <>
      <Link href="/trainer/dashboard" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/trainer/dashboard' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
        Dashboard
      </Link>
      <Link href="/trainer/attendance" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/trainer/attendance' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
        Mark Attendance
      </Link>
      <Link href="/trainer/reports" className={`block px-4 py-3 rounded-lg transition-all font-medium ${pathname === '/trainer/reports' ? 'bg-white text-gray-900 font-semibold shadow-lg' : 'hover:bg-white/10 text-white'}`}>
        My Reports
      </Link>
    </>
  );

  return (
    <nav className="text-white shadow-2xl" style={{ backgroundColor: '#0b0a0f' }}>
      <div className="max-w-[95%] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center">
            <Link 
              href={role === 'ADMIN' || role === 'TEACHER' ? '/dashboard' : '/trainer/dashboard'} 
              className="flex items-center hover:opacity-90 transition-opacity"
            >
              <img
                src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
                alt="Robochamps Logo"
                className="h-10 sm:h-12 lg:h-14 w-auto object-contain"
              />
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 ml-4 xl:ml-6">
              {navLinks}
            </div>
          </div>
          
          {/* Desktop User Section */}
          <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
            <div className="flex items-center space-x-2 xl:space-x-3 bg-white/5 px-3 xl:px-4 py-2 rounded-lg border border-white/10">
              <div className="w-8 xl:w-9 h-8 xl:h-9 bg-white/20 rounded-full flex items-center justify-center font-semibold text-white text-sm">
                {session.user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs xl:text-sm font-medium text-white hidden xl:inline">{session.user?.name}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 xl:px-6 py-2 xl:py-2.5 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-sm xl:text-base touch-manipulation"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 py-4 space-y-2">
            {navLinks}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center space-x-3 bg-white/5 px-4 py-3 rounded-lg border border-white/10">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold text-white">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">{session.user?.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg text-center touch-manipulation"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
