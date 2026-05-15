'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import StatsCard from '@/components/StatsCard';
import MiniBarChart from '@/components/MiniBarChart';
import QuickActionButton from '@/components/QuickActionButton';
import TeacherDashboard from '@/components/TeacherDashboard';

interface DashboardStats {
  totalUsers: number;
  totalSchools: number;
  totalAttendance: number;
  totalReports: number;
  totalMeetingLinks: number;
  recentAttendance: number[];
}

function DashboardContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSchools: 0,
    totalAttendance: 0,
    totalReports: 0,
    totalMeetingLinks: 0,
    recentAttendance: [4, 7, 5, 9, 6, 8, 3, 7, 5, 8, 6, 9],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, schoolsRes, attendanceRes, reportsRes, meetingRes] = await Promise.allSettled([
        fetch('/api/users'),
        fetch('/api/schools'),
        fetch('/api/attendance'),
        fetch('/api/reports'),
        fetch('/api/meeting-links/stats'),
      ]);

      const users = usersRes.status === 'fulfilled' && usersRes.value.ok ? await usersRes.value.json() : null;
      const schools = schoolsRes.status === 'fulfilled' && schoolsRes.value.ok ? await schoolsRes.value.json() : null;
      const attendance = attendanceRes.status === 'fulfilled' && attendanceRes.value.ok ? await attendanceRes.value.json() : null;
      const reports = reportsRes.status === 'fulfilled' && reportsRes.value.ok ? await reportsRes.value.json() : null;
      const meetings = meetingRes.status === 'fulfilled' && meetingRes.value.ok ? await meetingRes.value.json() : null;

      setStats({
        totalUsers: users?.users?.length || 0,
        totalSchools: schools?.schools?.length || 0,
        totalAttendance: attendance?.records?.length || 0,
        totalReports: reports?.reports?.length || 0,
        totalMeetingLinks: meetings?.meetingLinks?.length || 0,
        recentAttendance: [4, 7, 5, 9, 6, 8, 3, 7, 5, 8, 6, 9],
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const role = (session?.user as any)?.role;

  if (role === 'TEACHER') {
    return <TeacherDashboard />;
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={loading ? '...' : stats.totalUsers}
          change="12%"
          changeType="positive"
          delay={0}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          chart={<MiniBarChart data={[3, 5, 7, 4, 8, 6, 9, 5, 7, 8]} />}
        />

        <StatsCard
          title="Attendance Records"
          value={loading ? '...' : stats.totalAttendance}
          change="8%"
          changeType="positive"
          delay={0.1}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          chart={<MiniBarChart data={[6, 4, 8, 5, 9, 7, 6, 8, 5, 7]} color="#10B981" />}
        />

        <StatsCard
          title="Active Meetings"
          value={loading ? '...' : stats.totalMeetingLinks}
          change="3"
          changeType="neutral"
          delay={0.2}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          }
          chart={<MiniBarChart data={[2, 4, 3, 5, 4, 6, 3, 5, 4, 3]} color="#3B82F6" />}
        />

        <StatsCard
          title="Reports Submitted"
          value={loading ? '...' : stats.totalReports}
          change="15%"
          changeType="positive"
          delay={0.3}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          chart={<MiniBarChart data={[5, 8, 6, 9, 7, 8, 4, 7, 9, 6]} color="#8B5CF6" />}
        />
      </div>

      {/* Middle Section: Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A]">Activity Overview</h3>
              <p className="text-sm text-[#6B7280]">Attendance and reports this month</p>
            </div>
            <select className="text-sm border border-gray-200 rounded-xl px-3 py-2 text-gray-600 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
          </div>

          {/* Chart Area */}
          <div className="h-52 flex items-end gap-2 px-2">
            {stats.recentAttendance.map((val, i) => (
              <motion.div
                key={i}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.05 }}
              >
                <div
                  className="w-full rounded-lg bg-gradient-to-t from-emerald-500 to-emerald-400 min-w-[20px]"
                  style={{ height: `${(val / 10) * 180}px` }}
                />
                <span className="text-[10px] text-gray-400 font-medium">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-br from-[#0B1F14] to-[#1a3a25] rounded-3xl p-6 text-white"
        >
          <h3 className="text-lg font-bold mb-2">Platform Summary</h3>
          <p className="text-emerald-300/70 text-sm mb-6">Overview of the ERP system</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">Schools</span>
              </div>
              <span className="text-lg font-bold">{loading ? '...' : stats.totalSchools}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">Trainers</span>
              </div>
              <span className="text-lg font-bold">{loading ? '...' : stats.totalUsers}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">Meetings</span>
              </div>
              <span className="text-lg font-bold">{loading ? '...' : stats.totalMeetingLinks}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">Reports</span>
              </div>
              <span className="text-lg font-bold">{loading ? '...' : stats.totalReports}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      {role === 'ADMIN' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3 className="text-lg font-bold text-[#0F172A] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              label="Manage Users"
              href="/dashboard/users"
              delay={0.7}
              color="emerald"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
            />
            <QuickActionButton
              label="View Attendance"
              href="/dashboard/attendance"
              delay={0.8}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <QuickActionButton
              label="Meeting Links"
              href="/dashboard/meeting-links"
              delay={0.9}
              color="purple"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              }
            />
            <QuickActionButton
              label="View Reports"
              href="/dashboard/reports"
              delay={1.0}
              color="amber"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
            />
          </div>
        </motion.div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
