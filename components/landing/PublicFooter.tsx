'use client';

import Link from 'next/link';
import { LOGO, PRODUCT_LINKS } from '@/components/landing/constants';

type PublicFooterProps = {
  mode?: 'landing' | 'link';
  onNavClick?: (sectionId: string) => void;
};

export default function PublicFooter({ mode = 'link', onNavClick }: PublicFooterProps) {
  return (
    <footer id="contact" className="text-white" style={{ background: 'linear-gradient(180deg, #07130D 0%, #0B1F14 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/">
              <img src={LOGO} alt="Robochamps" className="h-10 object-contain mb-4 brightness-0 invert" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Robochamps ERP — Smart robotics training management with attendance, reports, analytics, and operational
              oversight.
            </p>
            <div className="flex gap-3 mt-6">
              {['in', 'x', 'yt'].map((s) => (
                <span
                  key={s}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400 uppercase"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Product</p>
            <ul className="space-y-2 text-sm text-gray-400">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  {mode === 'landing' && onNavClick ? (
                    <button
                      type="button"
                      onClick={() => onNavClick(l.href.replace('/#', ''))}
                      className="hover:text-white transition-colors"
                    >
                      {l.label}
                    </button>
                  ) : (
                    <Link href={l.href} className="hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Account</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-gray-400 hover:text-white">
                  Signup
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">Contact</p>
            <p className="text-sm text-gray-400">support@robochamps.com</p>
            <p className="text-sm text-gray-400 mt-2">Robotics training programs worldwide</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Robochamps ERP. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-white">
              Login
            </Link>
            <Link href="/signup" className="hover:text-white">
              Signup
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
