'use client';

import PublicHeader from '@/components/landing/PublicHeader';
import PublicFooter from '@/components/landing/PublicFooter';

type PublicPageLayoutProps = {
  children: React.ReactNode;
  /** Extra top padding below fixed header (default suits auth forms) */
  mainClassName?: string;
};

export default function PublicPageLayout({
  children,
  mainClassName = 'flex-1 flex items-center justify-center px-4 py-28 sm:py-32',
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col text-[#0F172A] antialiased" style={{ background: '#F4F7F5' }}>
      <PublicHeader mode="link" />
      <main className={mainClassName}>{children}</main>
      <PublicFooter mode="link" />
    </div>
  );
}
