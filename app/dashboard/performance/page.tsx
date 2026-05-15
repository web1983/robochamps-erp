'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { format, subMonths } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AttendanceRow {
  datetime: string;
  schoolId: string;
}

export default function PerformancePage() {
  const { data: session } = useSession();
  const schoolId = (session?.user as any)?.schoolId as string | undefined;
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const res = await fetch('/api/attendance');
        const data = res.ok ? await res.json() : { records: [] };
        if (!c) {
          setRows(
            (data.records || []).map((x: any) => ({
              schoolId: x.schoolId,
              datetime: typeof x.datetime === 'string' ? x.datetime : new Date(x.datetime).toISOString(),
            }))
          );
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const scoped = useMemo(() => {
    if (!schoolId) return rows;
    return rows.filter((r) => r.schoolId === schoolId);
  }, [rows, schoolId]);

  const trend = useMemo(() => {
    const out: { label: string; sessions: number; score: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = subMonths(new Date(), i);
      const label = format(ref, 'MMM');
      const y = ref.getFullYear();
      const m = ref.getMonth();
      let sessions = 0;
      for (const r of scoped) {
        const d = new Date(r.datetime);
        if (d.getFullYear() === y && d.getMonth() === m) sessions++;
      }
      const score = Math.min(100, 35 + sessions * 6 + i * 3);
      out.push({ label, sessions, score });
    }
    return out;
  }, [scoped]);

  if (loading) {
    return <div className="h-48 rounded-3xl bg-white border border-[#E5E7EB] animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0F172A]">Performance</h1>
        <p className="text-[#6B7280] mt-1">Engagement trend based on attendance volume in your scope.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Session trend</h2>
          <p className="text-sm text-[#6B7280] mb-4">Last six months</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                  }}
                />
                <Area type="monotone" dataKey="sessions" stroke="#22C55E" fill="url(#perfArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-[#E5E7EB] bg-gradient-to-br from-[#0B1F14] to-[#143A28] p-6 text-white shadow-lg"
        >
          <h2 className="text-lg font-bold mb-1">Engagement index</h2>
          <p className="text-emerald-200/80 text-sm mb-6">Composite from recent session cadence</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    background: '#0F172A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="#4ADE80" strokeWidth={2} dot={{ r: 3, fill: '#22C55E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[#6B7280]">
        Batch rankings are not stored server-side; this view summarizes attendance-derived activity for your account.
      </motion.p>
    </div>
  );
}
