'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import GlowButton from '@/components/landing/GlowButton';
import { LOGO, PUBLIC_NAV } from '@/components/landing/constants';

type PublicHeaderProps = {
  /** On landing page, nav scrolls to sections; on auth pages, links go to /#section */
  mode?: 'landing' | 'link';
  onNavClick?: (sectionId: string) => void;
};

export default function PublicHeader({ mode = 'link', onNavClick }: PublicHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLogin = pathname === '/login';
  const isSignup = pathname === '/signup';
  const solidBar = mode === 'link' || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (sectionId: string) => {
    setMobileOpen(false);
    if (mode === 'landing' && onNavClick) {
      onNavClick(sectionId);
    }
  };

  const navItemClass =
    'text-sm font-medium text-[#6B7280] hover:text-emerald-600 transition-colors';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solidBar
          ? 'bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <motion.div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img src={LOGO} alt="Robochamps ERP" className="h-8 object-contain" />
          <span className="font-bold text-sm sm:text-base text-[#0F172A] hidden sm:inline">Robochamps ERP</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {PUBLIC_NAV.map((item) =>
            mode === 'landing' && onNavClick ? (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNav(item.href.replace('/#', ''))}
                className={navItemClass}
              >
                {item.label}
              </button>
            ) : (
              <Link key={item.label} href={item.href} className={navItemClass}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {isLogin ? (
            <span className="text-sm font-semibold text-emerald-600 px-4 py-2">Login</span>
          ) : (
            <GlowButton href="/login" variant="outline">
              Login
            </GlowButton>
          )}
          {isSignup ? (
            <span className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30">
              Get Started
            </span>
          ) : (
            <GlowButton href="/signup">Get Started</GlowButton>
          )}
        </div>

        <button
          type="button"
          className="lg:hidden p-2 rounded-xl border border-[#E5E7EB] bg-white/80"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[#E5E7EB] bg-white/95 backdrop-blur-xl px-4 py-4 space-y-3"
          >
            {PUBLIC_NAV.map((item) =>
              mode === 'landing' && onNavClick ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNav(item.href.replace('/#', ''))}
                  className="block w-full text-left py-2 text-sm font-medium text-[#374151]"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm font-medium text-[#374151]"
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="flex flex-col gap-2 pt-2">
              {!isLogin && (
                <GlowButton href="/login" variant="outline" className="w-full">
                  Login
                </GlowButton>
              )}
              {!isSignup && (
                <GlowButton href="/signup" className="w-full">
                  Get Started
                </GlowButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
