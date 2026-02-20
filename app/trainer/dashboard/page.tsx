import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import MeetingLinksSection from '@/components/MeetingLinksSection';

export default async function TrainerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = (session.user as any).role;
  if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1b1d1e' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Trainer Dashboard
        </h1>

        <MeetingLinksSection />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/trainer/attendance"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-blue-500/50 hover:border-blue-500"
          >
            <div className="text-4xl mb-4">📸</div>
            <h2 className="text-xl font-semibold mb-2 text-white">Mark Attendance</h2>
            <p className="text-white/80">Take a photo and mark your class attendance</p>
          </Link>

          <Link
            href="/trainer/reports/new"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-green-500/50 hover:border-green-500"
          >
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2 text-white">Create Report</h2>
            <p className="text-white/80">Submit your daily class report</p>
          </Link>

          <Link
            href="/trainer/reports"
            className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-purple-500/50 hover:border-purple-500"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2 text-white">View Reports</h2>
            <p className="text-white/80">See all your submitted reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
