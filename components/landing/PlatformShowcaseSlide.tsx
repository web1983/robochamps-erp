'use client';

import MiniBarChart from '@/components/MiniBarChart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const BG = '#F4F7F5';
const chartData = [
  { d: 'M', v: 42 },
  { d: 'T', v: 58 },
  { d: 'W', v: 51 },
  { d: 'T', v: 67 },
  { d: 'F', v: 72 },
];

function BrowserChrome() {
  return (
    <div className="flex items-center gap-2 min-w-0 px-4 py-3 border-b border-[#E5E7EB] bg-white">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
      </div>
      <div className="flex-1 min-w-0 mx-2 h-7 rounded-lg bg-[#F4F7F5] border border-[#E5E7EB] flex items-center px-3">
        <span className="text-[10px] text-[#6B7280] truncate">robochamps-erp.vercel.app/dashboard</span>
      </div>
    </div>
  );
}

function Sidebar({ active = 0 }: { active?: number }) {
  return (
    <div
      className="w-12 sm:w-16 shrink-0 py-4 px-2 space-y-2 border-r border-white/10"
      style={{ background: 'linear-gradient(180deg, #07130D 0%, #0B1F14 100%)' }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`h-2 rounded ${i === active ? 'bg-emerald-400/90 w-full max-w-[2rem]' : 'bg-white/10 w-4 sm:w-6'}`}
        />
      ))}
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="rounded-xl sm:rounded-2xl bg-white border border-[#E5E7EB] p-2.5 sm:p-3 shadow-sm">
      <p className="text-[9px] sm:text-[10px] text-[#6B7280] font-medium truncate">{title}</p>
      <p className="text-base sm:text-lg font-bold text-[#0F172A]">{value}</p>
      <MiniBarChart data={[2, 4, 3, 5, 6, 4, 7]} color={color} height={24} />
    </div>
  );
}

function AdminPreview() {
  return (
    <div className="flex min-h-[280px] sm:min-h-[320px] min-w-0 w-full">
      <Sidebar active={0} />
      <div className="flex-1 min-w-0 p-3 sm:p-4" style={{ background: BG }}>
        <p className="text-xs sm:text-sm font-bold text-[#0F172A] mb-3">Admin Dashboard</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <StatCard title="Users" value="248" color="#22C55E" />
          <StatCard title="Schools" value="86" color="#3B82F6" />
          <StatCard title="Attendance" value="10k" color="#8B5CF6" />
          <StatCard title="Reports" value="1.2k" color="#F59E0B" />
        </div>
        <div className="h-28 sm:h-36 min-h-0 rounded-xl bg-white border border-[#E5E7EB] p-2 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="showcaseAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#22C55E" fill="url(#showcaseAdmin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function TeacherPreview() {
  return (
    <div className="flex min-h-[280px] sm:min-h-[320px] min-w-0 w-full">
      <Sidebar active={1} />
      <div className="flex-1 min-w-0 p-3 sm:p-4" style={{ background: BG }}>
        <p className="text-xs sm:text-sm font-bold text-[#0F172A] mb-3">School View Dashboard</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <StatCard title="Attendance" value="92%" color="#22C55E" />
            <StatCard title="Meetings" value="6" color="#3B82F6" />
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold text-[#0F172A] mb-2">Upcoming session</p>
            <p className="text-xs text-[#6B7280]">Robotics Lab · Grade 8</p>
            <p className="text-xs text-emerald-600 font-medium mt-2">Today · 10:30 AM</p>
            <div className="mt-3 flex gap-2">
              <span className="flex-1 text-center text-[10px] font-semibold py-2 rounded-xl bg-emerald-500 text-white">
                Join
              </span>
              <span className="flex-1 text-center text-[10px] font-semibold py-2 rounded-xl border border-[#E5E7EB] text-[#374151]">
                View PPT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainerPreview() {
  return (
    <div className="flex min-h-[280px] sm:min-h-[320px] min-w-0 w-full">
      <Sidebar active={2} />
      <div className="flex-1 min-w-0 p-3 sm:p-4" style={{ background: BG }}>
        <p className="text-xs sm:text-sm font-bold text-[#0F172A] mb-3">Trainer Dashboard</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatCard title="Sessions" value="24" color="#22C55E" />
          <StatCard title="Reports" value="18" color="#3B82F6" />
        </div>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
          <p className="text-[10px] font-semibold text-[#0F172A]">Quick actions</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {['Mark Attendance', 'Submit Report', 'View PPT', 'Combined Sheet'].map((a) => (
              <span
                key={a}
                className="text-[9px] sm:text-[10px] text-center py-2 px-1 rounded-xl bg-[#F4F7F5] border border-[#E5E7EB] text-[#374151] font-medium"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendancePreview() {
  return (
    <div className="flex min-h-[280px] sm:min-h-[320px] min-w-0 w-full">
      <Sidebar active={1} />
      <div className="flex-1 min-w-0 p-3 sm:p-4 flex items-center justify-center" style={{ background: BG }}>
        <div className="w-full max-w-sm rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-sm font-bold text-[#0F172A] mb-1">Mark Attendance</p>
          <p className="text-xs text-[#6B7280] mb-4">Photo + location verification</p>
          <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 h-28 flex items-center justify-center mb-3">
            <span className="text-3xl">📸</span>
          </div>
          <div className="space-y-2">
            <div className="h-9 rounded-xl bg-[#F4F7F5] border border-[#E5E7EB] px-3 flex items-center text-xs text-[#6B7280]">
              Grade 6-A · Robotics
            </div>
            <div className="h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-xs font-semibold text-white">
              Submit attendance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div className="flex min-h-[280px] sm:min-h-[320px] min-w-0 w-full">
      <Sidebar active={0} />
      <div className="flex-1 min-w-0 p-3 sm:p-4" style={{ background: BG }}>
        <p className="text-xs sm:text-sm font-bold text-[#0F172A] mb-3">Analytics Overview</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="h-32 sm:h-40 min-h-0 rounded-xl bg-white border border-[#E5E7EB] p-2 overflow-hidden">
            <p className="text-[10px] text-[#6B7280] mb-1 px-1">Weekly attendance</p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData}>
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Bar dataKey="v" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-32 sm:h-40 min-h-0 rounded-xl bg-white border border-[#E5E7EB] p-2 overflow-hidden">
            <p className="text-[10px] text-[#6B7280] mb-1 px-1">Report trends</p>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export type ShowcaseVariant = 'admin' | 'teacher' | 'trainer' | 'attendance' | 'analytics';

const PREVIEWS: Record<ShowcaseVariant, () => JSX.Element> = {
  admin: AdminPreview,
  teacher: TeacherPreview,
  trainer: TrainerPreview,
  attendance: AttendancePreview,
  analytics: AnalyticsPreview,
};

export default function PlatformShowcaseSlide({ variant }: { variant: ShowcaseVariant }) {
  const Preview = PREVIEWS[variant];
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-inner">
      <BrowserChrome />
      <Preview />
    </div>
  );
}
