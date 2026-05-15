'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { format, startOfDay, subDays, subMonths, parseISO, isValid, isBefore } from 'date-fns';
import StatsCard from '@/components/StatsCard';
import MiniBarChart from '@/components/MiniBarChart';
import QuickActionButton from '@/components/QuickActionButton';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = {
  primary: '#22C55E',
  muted: '#6B7280',
  heading: '#0F172A',
  border: '#E5E7EB',
  card: '#FFFFFF',
  bg: '#F4F7F5',
};

interface MeetingLink {
  _id: string;
  title: string;
  url: string;
  description?: string;
  pptDriveLink?: string;
  isActive: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
}

interface ReportRow {
  _id: string;
  datetime: string;
  topics: string;
  classLabel?: string;
}

interface AttendanceRow {
  _id: string;
  schoolId: string;
  classLabel: string;
  datetime: string;
}

function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function useMeetingCountdown(target?: Date | null) {
  const [label, setLabel] = useState('—');
  useEffect(() => {
    if (!target || !isValid(target)) {
      setLabel('—');
      return;
    }
    const tick = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setLabel('Starting now');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return label;
}

function meetingTargetDate(link: MeetingLink): Date | null {
  if (!link.scheduledDate) return null;
  try {
    const t = link.scheduledTime ? `${link.scheduledDate}T${link.scheduledTime}` : link.scheduledDate;
    const d = parseISO(t);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

const chartTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)',
  },
  labelStyle: { color: COLORS.heading, fontWeight: 600 },
};

export type AnalyticsDashboardMode = 'teacher' | 'trainer';

const ROUTES = {
  teacher: {
    attendance: '/dashboard/attendance',
    meetingLinks: '/dashboard/meeting-links',
    performance: '/dashboard/performance',
    reports: '/dashboard/reports',
    upload: '/dashboard/training-report/new',
  },
  trainer: {
    attendance: '/trainer/attendance',
    meetingLinks: '/trainer/meeting-links',
    performance: '/trainer/performance',
    reports: '/trainer/reports',
    upload: '/trainer/reports/new',
  },
} as const;

export default function TeacherDashboard({ mode = 'teacher' }: { mode?: AnalyticsDashboardMode }) {
  const routes = ROUTES[mode];
  const { data: session } = useSession();
  const schoolId = mode === 'teacher' ? ((session?.user as any)?.schoolId as string | undefined) : undefined;

  const [meetings, setMeetings] = useState<MeetingLink[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mRes, rRes, aRes] = await Promise.all([
          fetch('/api/meeting-links'),
          fetch('/api/reports'),
          fetch('/api/attendance'),
        ]);
        const mJson = mRes.ok ? await mRes.json() : { meetingLinks: [] };
        const rJson = rRes.ok ? await rRes.json() : { reports: [] };
        const aJson = aRes.ok ? await aRes.json() : { records: [] };
        if (cancelled) return;
        setMeetings(mJson.meetingLinks || []);
        setReports(
          (rJson.reports || []).map((x: any) => ({
            ...x,
            datetime: typeof x.datetime === 'string' ? x.datetime : new Date(x.datetime).toISOString(),
          }))
        );
        setAttendance(
          (aJson.records || []).map((x: any) => ({
            ...x,
            datetime: typeof x.datetime === 'string' ? x.datetime : new Date(x.datetime).toISOString(),
          }))
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAttendance = useMemo(() => {
    if (!schoolId) return attendance;
    return attendance.filter((a) => a.schoolId === schoolId);
  }, [attendance, schoolId]);

  const attendancePercent = useMemo(() => {
    const cutoff = startOfDay(subDays(new Date(), 14));
    const days = new Set<string>();
    for (const r of filteredAttendance) {
      const d = new Date(r.datetime);
      if (d >= cutoff) days.add(format(d, 'yyyy-MM-dd'));
    }
    return Math.min(100, Math.round((days.size / 14) * 100));
  }, [filteredAttendance]);

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter((m) => m.isActive)
      .filter((m) => {
        const t = meetingTargetDate(m);
        if (!t) return true;
        return !isBefore(startOfDay(t), startOfDay(now));
      })
      .sort((a, b) => {
        const ta = meetingTargetDate(a)?.getTime() ?? Infinity;
        const tb = meetingTargetDate(b)?.getTime() ?? Infinity;
        return ta - tb;
      });
  }, [meetings]);

  const upcomingCount = upcomingMeetings.length;
  const submittedReports = reports.length;

  const sessionsNeedingReport = useMemo(() => {
    const reportDates = new Set(
      reports.map((r) => format(startOfDay(new Date(r.datetime)), 'yyyy-MM-dd'))
    );
    let n = 0;
    for (const m of upcomingMeetings) {
      const t = meetingTargetDate(m);
      if (!t) continue;
      const key = format(startOfDay(t), 'yyyy-MM-dd');
      if (!reportDates.has(key)) n++;
    }
    return n;
  }, [upcomingMeetings, reports]);

  const pendingTasks = Math.min(20, sessionsNeedingReport);

  const weeklyBars = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const base = subDays(new Date(), 6);
    for (const r of filteredAttendance) {
      const d = new Date(r.datetime);
      if (d < startOfDay(base)) continue;
      const idx = (d.getDay() + 6) % 7;
      counts[idx]++;
    }
    return labels.map((name, i) => ({ name, sessions: counts[i] }));
  }, [filteredAttendance]);

  const monthlyArea = useMemo(() => {
    const out: { month: string; sessions: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = subMonths(new Date(), i);
      const label = format(ref, 'MMM');
      const y = ref.getFullYear();
      const m = ref.getMonth();
      let sessions = 0;
      for (const r of filteredAttendance) {
        const d = new Date(r.datetime);
        if (d.getFullYear() === y && d.getMonth() === m) sessions++;
      }
      out.push({ month: label, sessions });
    }
    return out;
  }, [filteredAttendance]);

  const subjectBars = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredAttendance) {
      const key = r.classLabel?.trim() || 'General';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 18 ? `${name.slice(0, 18)}…` : name, value }));
  }, [filteredAttendance]);

  const performanceLine = useMemo(() => {
    return monthlyArea.map((x, i) => ({
      ...x,
      completion: Math.min(100, 40 + i * 8 + (x.sessions > 0 ? 20 : 0)),
    }));
  }, [monthlyArea]);

  const ringData = [{ name: 'att', value: attendancePercent, fill: COLORS.primary }];

  const displayPercent = useCountUp(loading ? 0 : attendancePercent);
  const displayMeetings = useCountUp(loading ? 0 : upcomingCount);
  const displayReports = useCountUp(loading ? 0 : submittedReports);
  const displayPending = useCountUp(loading ? 0 : pendingTasks);

  const nextMeeting = upcomingMeetings[0];
  const nextTarget = nextMeeting ? meetingTargetDate(nextMeeting) : null;
  const countdown = useMeetingCountdown(nextTarget);

  const trackJoin = useCallback(async (meetingLinkId: string) => {
    try {
      await fetch('/api/meeting-links/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLinkId }),
      });
    } catch {
      /* non-blocking */
    }
  }, []);

  const reportsThisMonth = useMemo(() => {
    const now = new Date();
    return reports.filter((r) => {
      const d = new Date(r.datetime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [reports]);

  const reportsLast30 = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    return reports.filter((r) => new Date(r.datetime) >= cutoff).length;
  }, [reports]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-white border border-[#E5E7EB]" />
          ))}
        </div>
        <div className="h-72 rounded-3xl bg-white border border-[#E5E7EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Attendance pulse"
          value={`${displayPercent}%`}
          change="14d window"
          changeType="positive"
          delay={0}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          chart={<MiniBarChart data={weeklyBars.map((w) => w.sessions)} color="#22C55E" />}
        />
        <StatsCard
          title="Upcoming meetings"
          value={displayMeetings}
          change="Next sessions"
          changeType="neutral"
          delay={0.08}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
            </svg>
          }
          chart={<MiniBarChart data={[2, 3, 2, 4, 3, 5, upcomingCount]} color="#3B82F6" />}
        />
        <StatsCard
          title="Submitted reports"
          value={displayReports}
          change={`${reportsThisMonth} this month`}
          changeType="positive"
          delay={0.16}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          chart={<MiniBarChart data={[4, 6, 5, 7, 6, 8, submittedReports % 10]} color="#8B5CF6" />}
        />
        <StatsCard
          title="Open follow-ups"
          value={displayPending}
          change="Est. workload"
          changeType="neutral"
          delay={0.24}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          }
          chart={<MiniBarChart data={[1, 2, 1, 3, 2, 2, pendingTasks]} color="#F59E0B" />}
        />
      </div>

      {/* Meeting links */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md p-6 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">Meeting links</h2>
            <p className="text-sm text-[#6B7280]">Join live sessions, review decks, stay on schedule.</p>
          </div>
          {nextMeeting && (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm">
              <p className="text-[#6B7280] text-xs font-semibold uppercase tracking-wide">Next session</p>
              <p className="font-semibold text-[#0F172A]">{nextMeeting.title}</p>
              <p className="text-emerald-700 font-mono text-sm mt-1">{countdown}</p>
            </div>
          )}
        </div>

        {upcomingMeetings.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No upcoming meetings. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {upcomingMeetings.slice(0, 4).map((link, idx) => {
              const target = meetingTargetDate(link);
              const isToday = target && startOfDay(target).getTime() === startOfDay(new Date()).getTime();
              return (
                <motion.div
                  key={link._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx }}
                  whileHover={{ y: -4 }}
                  className="group relative overflow-hidden rounded-3xl border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F4F7F5] p-5 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(800px_200px_at_80%_-20%,rgba(34,197,94,0.12),transparent)] pointer-events-none" />
                  <div className="relative flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[#0F172A]">{link.title}</h3>
                        <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">
                          {link.description?.trim() || 'Live training session'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          isToday
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isToday ? 'Today' : target ? format(target, 'MMM d') : 'Open'}
                      </span>
                    </div>
                    <div className="text-sm text-[#6B7280]">
                      {target ? (
                        <span>
                          {format(target, 'PPp')}
                          {link.scheduledTime && !link.scheduledDate?.includes('T') ? '' : ''}
                        </span>
                      ) : (
                        <span>Flexible timing</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => void trackJoin(link._id)}
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity"
                      >
                        Join meeting
                      </a>
                      {link.pptDriveLink ? (
                        <a
                          href={link.pptDriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                        >
                          View PPT
                        </a>
                      ) : (
                        <span className="inline-flex items-center rounded-xl border border-dashed border-[#E5E7EB] px-4 py-2.5 text-sm text-[#6B7280]">
                          PPT not linked
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Attendance + ring */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">Weekly attendance</h3>
              <p className="text-sm text-[#6B7280]">Sessions logged per weekday (your scope)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBars} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="sessions" radius={[10, 10, 0, 0]} fill={COLORS.primary} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col items-center justify-center"
        >
          <h3 className="text-lg font-bold text-[#0F172A] mb-1 w-full text-left">Attendance ring</h3>
          <p className="text-sm text-[#6B7280] mb-4 w-full text-left">14-day consistency index</p>
          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="68%"
                outerRadius="100%"
                data={ringData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: '#E5E7EB' }} dataKey="value" cornerRadius={10} animationDuration={1000} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-[#0F172A]">{attendancePercent}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-[#0F172A] mb-1">Monthly volume</h3>
          <p className="text-sm text-[#6B7280] mb-4">Attendance sessions trend</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyArea} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...chartTooltip} />
                <Area type="monotone" dataKey="sessions" stroke={COLORS.primary} fill="url(#areaGreen)" strokeWidth={2} animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
        >
          <h3 className="text-lg font-bold text-[#0F172A] mb-1">Subject-wise sessions</h3>
          <p className="text-sm text-[#6B7280] mb-4">By class label from attendance</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={subjectBars.length ? subjectBars : [{ name: '—', value: 0 }]}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={900}>
                  {(subjectBars.length ? subjectBars : [{ name: '—', value: 0 }]).map((_, i) => (
                    <Cell key={i} fill={['#22C55E', '#16A34A', '#4ADE80', '#86EFAC', '#BBF7D0', '#DCFCE7'][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Performance */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Performance analytics</h3>
            <p className="text-sm text-[#6B7280]">Engagement index vs. monthly session volume</p>
          </div>
          <Link
            href={routes.performance}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Open full analytics →
          </Link>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceLine} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip {...chartTooltip} />
              <Line type="monotone" dataKey="sessions" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} animationDuration={900} />
              <Line type="monotone" dataKey="completion" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-2 text-xs text-[#6B7280]">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Sessions
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Engagement index
          </span>
        </div>
      </motion.section>

      {/* Reports summary */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Submitted reports', value: submittedReports, hint: 'All-time training logs', tone: 'from-emerald-500/90 to-emerald-600' },
          { label: 'Pending reports', value: sessionsNeedingReport, hint: 'Sessions without a same-day log', tone: 'from-amber-500/90 to-amber-600' },
          { label: 'Approved reports', value: reportsLast30, hint: 'Recent completions (30d)', tone: 'from-blue-500/90 to-blue-600' },
          { label: 'Rejected reports', value: 0, hint: 'Not tracked in this build', tone: 'from-slate-600/90 to-slate-800' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            whileHover={{ y: -3 }}
            className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-sm overflow-hidden relative"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-25 bg-gradient-to-br ${card.tone}`} />
            <p className="text-sm font-medium text-[#6B7280] relative">{card.label}</p>
            <p className="text-3xl font-bold text-[#0F172A] mt-2 relative">{card.value}</p>
            <p className="text-xs text-[#6B7280] mt-2 relative">{card.hint}</p>
          </motion.div>
        ))}
      </motion.section>
      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="text-lg font-bold text-[#0F172A] mb-4">Quick actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            label="Mark attendance"
            href={routes.attendance}
            delay={0.1}
            color="emerald"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <QuickActionButton
            label="Upload assignment"
            href={routes.upload}
            delay={0.15}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            }
          />
          <QuickActionButton
            label="View PPT"
            href={routes.meetingLinks}
            delay={0.2}
            color="purple"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5m-13.5 0V21m18-10.5v.75m0 0V21m-1.5 0h15M6.75 18h7.5m-7.5 0h-3m3 0v-4.875c0-.621.504-1.125 1.125-1.125h4.125c.621 0 1.125.504 1.125 1.125V18M3.75 5.25h15m-15 0A2.25 2.25 0 005.25 3h13.5a2.25 2.25 0 012.25 2.25m-15 0v8.25" />
              </svg>
            }
          />
          <QuickActionButton
            label="Submit report"
            href={routes.reports}
            delay={0.25}
            color="amber"
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
          />
        </div>
      </motion.div>
    </div>
  );
}
