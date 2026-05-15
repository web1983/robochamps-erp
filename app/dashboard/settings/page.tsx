'use client';

import { motion } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import { formatRoleLabel } from '@/lib/roleLabels';

export default function SettingsPage() {
  const { data: session } = useSession();
  const name = session?.user?.name || '—';
  const email = session?.user?.email || '—';
  const role = ((session?.user as any)?.role as string) || '—';
  const schoolId = (session?.user as any)?.schoolId as string | undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-[#6B7280] mt-1">Account overview for this ERP session.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md p-6 shadow-sm space-y-4"
      >
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Name</p>
          <p className="text-[#0F172A] font-medium mt-1">{name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Email</p>
          <p className="text-[#0F172A] font-medium mt-1">{email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Role</p>
          <p className="text-[#0F172A] font-medium mt-1">{formatRoleLabel(role)}</p>
        </div>
        {schoolId && (
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">School ID</p>
            <p className="text-[#0F172A] font-mono text-sm mt-1 break-all">{schoolId}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-4 w-full sm:w-auto rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
        >
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
