'use client';

import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  delay?: number;
  chart?: React.ReactNode;
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon,
  delay = 0,
  chart,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          {icon}
        </div>
        {change && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
              changeType === 'positive'
                ? 'bg-emerald-50 text-emerald-600'
                : changeType === 'negative'
                ? 'bg-red-50 text-red-600'
                : 'bg-gray-50 text-gray-600'
            }`}
          >
            {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''} {change}
          </span>
        )}
      </div>

      <div>
        <p className="text-[#6B7280] text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-[#0F172A] tracking-tight">{value}</p>
      </div>

      {chart && <div className="mt-4">{chart}</div>}
    </motion.div>
  );
}
