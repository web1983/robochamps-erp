'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface QuickActionButtonProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  color?: string;
  delay?: number;
}

export default function QuickActionButton({ label, href, icon, color = 'emerald', delay = 0 }: QuickActionButtonProps) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br ${colorMap[color] || colorMap.emerald} shadow-lg cursor-pointer`}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
            {icon}
          </div>
          <span className="text-white font-semibold text-sm text-center">{label}</span>
        </motion.div>
      </Link>
    </motion.div>
  );
}
