'use client';

import { motion } from 'framer-motion';

interface MiniBarChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export default function MiniBarChart({ data, color = '#22C55E', height = 40 }: MiniBarChartProps) {
  const max = Math.max(...data);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((value, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(value / max) * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="flex-1 rounded-sm min-w-[3px]"
          style={{
            backgroundColor: color,
            opacity: 0.4 + (value / max) * 0.6,
          }}
        />
      ))}
    </div>
  );
}
