import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Link from 'next/link';

export default async function Home() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error('Session error:', error);
    // Continue without session if there's an error
  }

  if (session) {
    const role = (session.user as any)?.role;
    
    if (role === 'ADMIN' || role === 'TEACHER') {
      redirect('/dashboard');
    } else if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      redirect('/trainer/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0e27] via-[#0f172a] to-[#1a1f3a]">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-12 border border-white/10">
        <div className="flex justify-center mb-8">
          <img
            src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
            alt="Robochamps Logo"
            className="h-24 w-auto object-contain"
          />
        </div>
        <h1 className="text-4xl font-bold text-center mb-3 text-white">
          ERP System
        </h1>
        <p className="text-center text-white/80 mb-10 text-lg">
          Manage trainers, attendance, and reports efficiently
        </p>
        
        <div className="space-y-4">
          <Link
            href="/signup"
            className="block w-full bg-white text-gray-900 text-center py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="block w-full bg-white/10 border-2 border-white/30 text-white text-center py-4 rounded-xl font-semibold hover:bg-white/20 transition-all text-lg"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
