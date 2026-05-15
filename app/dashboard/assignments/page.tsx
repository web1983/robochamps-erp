'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AssignmentsPage() {
  return (
    <motion.div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[#0F172A]">Assignments</h1>
        <p className="text-[#6B7280] mt-1">Training deliverables and session write-ups from your school.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md p-8 shadow-sm"
      >
        <p className="text-[#0F172A] leading-relaxed">
          Review training and class reports from your school&apos;s trainers. Session write-ups submitted by school and
          Robochamps trainers are listed in Reports.
        </p>
        <motion.div className="mt-8">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity"
          >
            View all reports
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
