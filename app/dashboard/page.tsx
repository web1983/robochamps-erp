import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import MeetingLinksSection from '@/components/MeetingLinksSection';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = (session.user as any).role;
  if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
    redirect('/trainer/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1f3a]" style={{ background: 'linear-gradient(135deg, #0a0e27 0%, #0f172a 50%, #1a1f3a 100%)' }}>
      <Navbar />
      <div className="max-w-[95%] 2xl:max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="mb-12">
          <h1 className="text-6xl font-extrabold text-white mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            {role === 'ADMIN' ? 'Admin Dashboard' : 'Teacher Dashboard'}
          </h1>
          <p className="text-white/80 text-xl">Welcome back! Manage your ERP system efficiently.</p>
        </div>

        <MeetingLinksSection />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-10 lg:mt-12">
          {role === 'TEACHER' && (
            <Link
              href="/dashboard/training-report/new"
              className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all border border-white/20 hover:border-white/40 transform hover:-translate-y-2 lg:hover:-translate-y-3 group overflow-hidden touch-manipulation active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl"></div>
              <div className="relative z-10">
                <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-5 lg:mb-6 group-hover:scale-125 transition-transform duration-300">📚</div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Training Report</h2>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed">Submit daily training report for trainers</p>
              </div>
            </Link>
          )}

          <Link
            href="/dashboard/reports"
            className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all border border-white/20 hover:border-white/40 transform hover:-translate-y-2 lg:hover:-translate-y-3 group overflow-hidden touch-manipulation active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl"></div>
            <div className="relative z-10">
              <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-5 lg:mb-6 group-hover:scale-125 transition-transform duration-300">📊</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">View Reports</h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">View all trainer and teacher reports</p>
            </div>
          </Link>

          <Link
            href="/dashboard/attendance"
            className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all border border-white/20 hover:border-white/40 transform hover:-translate-y-2 lg:hover:-translate-y-3 group overflow-hidden touch-manipulation active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl"></div>
            <div className="relative z-10">
              <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-5 lg:mb-6 group-hover:scale-125 transition-transform duration-300">✅</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Attendance</h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">View and export attendance records</p>
            </div>
          </Link>

          <Link
            href="/dashboard/combined-records"
            className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all border border-white/20 hover:border-white/40 transform hover:-translate-y-2 lg:hover:-translate-y-3 group overflow-hidden touch-manipulation active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl"></div>
            <div className="relative z-10">
              <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-5 lg:mb-6 group-hover:scale-125 transition-transform duration-300">📋</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Combined Sheet</h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed">View attendance and reports together</p>
            </div>
          </Link>

          {role === 'ADMIN' && (
            <>
              <Link
                href="/dashboard/users"
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all border border-white/20 hover:border-white/40 transform hover:-translate-y-2 lg:hover:-translate-y-3 group overflow-hidden touch-manipulation active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-5 lg:mb-6 group-hover:scale-125 transition-transform duration-300">👥</div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">User Management</h2>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed">Create and manage users and admins</p>
                </div>
              </Link>
              <Link
                href="/dashboard/schools"
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all border border-white/20 hover:border-white/40 transform hover:-translate-y-2 lg:hover:-translate-y-3 group overflow-hidden touch-manipulation active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-5 lg:mb-6 group-hover:scale-125 transition-transform duration-300">🏫</div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Schools</h2>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed">Manage schools and locations</p>
                </div>
              </Link>
              <Link
                href="/dashboard/meeting-links"
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.1)] transition-all border border-white/20 hover:border-white/40 transform hover:-translate-y-2 lg:hover:-translate-y-3 group overflow-hidden touch-manipulation active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl"></div>
                <div className="relative z-10">
                  <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-5 lg:mb-6 group-hover:scale-125 transition-transform duration-300">🔗</div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-white">Meeting Links</h2>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed">Manage meeting links and track clicks</p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
