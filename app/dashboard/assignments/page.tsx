'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AssignmentsPage() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[#0F172A]">Assignments</h1>
        <p className="text-[#6B7280] mt-1">Training deliverables and session write-ups live in one place.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md p-8 shadow-sm"
      >
        <p className="text-[#0F172A] leading-relaxed">
          Log your training topics, summaries, and notes as a <strong>training report</strong>. That keeps assignments
          aligned with the same workflow your admins review in Reports.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/training-report/new"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity"
          >
            New training report
          </Link>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-semibold text-[#0F172A] hover:border-emerald-300 transition-colors"
          >
            View all reports
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
