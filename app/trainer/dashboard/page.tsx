'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import TeacherDashboard from '@/components/TeacherDashboard';

function DashboardSkeleton() {
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

function TrainerDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'TRAINER_ROBOCHAMPS' && role !== 'TRAINER_SCHOOL') {
        router.push('/dashboard');
        return;
      }
      const success = searchParams.get('success');
      if (success) {
        setSuccessMessage(decodeURIComponent(success));
        setShowSuccess(true);
        router.replace('/trainer/dashboard');
        const t = setTimeout(() => setShowSuccess(false), 5000);
        return () => clearTimeout(t);
      }
    }
  }, [status, session, router, searchParams]);

  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  if (!session) return null;

  return (
    <>
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800"
        >
          <p className="font-semibold text-sm">{successMessage}</p>
        </motion.div>
      )}
      <TeacherDashboard mode="trainer" />
    </>
  );
}

export default function TrainerDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <TrainerDashboardContent />
    </Suspense>
  );
}
