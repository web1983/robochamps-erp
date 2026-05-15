'use client';

import { motion } from 'framer-motion';
import PageBackLink from '@/components/PageBackLink';

const items = [
  { title: 'Weekly digest', body: 'Your attendance is synced with the ERP admin dashboard every morning.', time: 'Today · 08:00' },
  { title: 'Meeting reminders', body: 'Join links stay pinned in Meeting Links; PPTs open in a new tab when provided.', time: 'Yesterday' },
  { title: 'Reports', body: 'Submit session reports regularly to keep admins aligned with your progress.', time: 'This week' },
];

export default function TrainerNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageBackLink href="/trainer/dashboard" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0F172A]">Notifications</h1>
        <p className="text-[#6B7280] mt-1">Updates and reminders for your training workspace.</p>
      </motion.div>
      <div className="space-y-4">
        {items.map((n, i) => (
          <motion.div
            key={n.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -2 }}
            className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">System</p>
                <h2 className="text-base font-bold text-[#0F172A] mt-1">{n.title}</h2>
                <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">{n.body}</p>
              </div>
              <span className="text-xs text-[#6B7280] shrink-0">{n.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
