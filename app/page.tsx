import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-6">
          <img
            src="https://res.cloudinary.com/dyyi3huje/image/upload/v1771491554/cropped-Robochamps-logo-2-1-1-2-1_wuea4w.png"
            alt="Robochamps Logo"
            className="h-16 mx-auto object-contain"
          />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              ERP System
            </h1>
            <p className="text-gray-500">
              Manage trainers, attendance, and reports efficiently
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/signup"
            className="block w-full bg-emerald-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-all"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="block w-full bg-transparent border-2 border-gray-200 text-gray-900 text-center py-3 rounded-lg font-semibold hover:border-emerald-500 hover:text-emerald-600 transition-all"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
