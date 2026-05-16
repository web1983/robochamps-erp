'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import PageBackLink from '@/components/PageBackLink';
import TrainerClassSessionForm from '@/components/trainer/TrainerClassSessionForm';

export default function LogClassSessionPage() {
  return (
    <motion.div className="space-y-6 max-w-2xl">
      <PageBackLink href="/trainer/dashboard" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0F172A]">Log class session</h1>
        <p className="text-[#6B7280] mt-1">
          Mark attendance and submit your class report in one step — right after your session.
        </p>
        <div className="flex flex-wrap gap-4 mt-3 text-sm font-medium">
          <Link href="/trainer/attendance/view" className="text-emerald-600 hover:underline">
            View attendance history
          </Link>
          <Link href="/trainer/reports" className="text-emerald-600 hover:underline">
            Session history
          </Link>
        </div>
      </motion.div>
      <TrainerClassSessionForm backHref="/trainer/dashboard" />
    </motion.div>
  );
}
