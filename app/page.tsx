import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import LandingPage from '@/components/landing/LandingPage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error('Session error:', error);
  }

  if (session) {
    const role = (session.user as { role?: string })?.role;

    if (role === 'ADMIN' || role === 'TEACHER') {
      redirect('/dashboard');
    }
    if (role === 'TRAINER_ROBOCHAMPS' || role === 'TRAINER_SCHOOL') {
      redirect('/trainer/dashboard');
    }
  }

  return <LandingPage />;
}
