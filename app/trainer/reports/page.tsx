'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import PageBackLink from '@/components/PageBackLink';

interface Report {
  _id: string;
  type: string;
  classLabel?: string;
  topics: string;
  summary: string;
  notes?: string;
  datetime: string;
  createdAt: string;
}

function TrainerReportsContent() {
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
    const success = searchParams.get('success');
    if (success) alert(decodeURIComponent(success));
  }, [searchParams]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports?type=TRAINER_CLASS');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch reports');
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-xl bg-white border border-[#E5E7EB]" />
        <div className="h-40 rounded-3xl bg-white border border-[#E5E7EB]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBackLink href="/trainer/dashboard" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">My Reports</h1>
          <p className="text-[#6B7280] mt-1">Session logs submitted from your training sessions.</p>
        </div>
        <Link
          href="/trainer/reports/new"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity"
        >
          + New Report
        </Link>
      </motion.div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
      )}

      {reports.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
          <p className="text-[#6B7280] mb-4">No reports found.</p>
          <Link href="/trainer/reports/new" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold hover:underline">
            Create your first report
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, idx) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * idx }}
              whileHover={{ y: -2 }}
              className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">{report.classLabel || 'Class Report'}</h3>
                  <p className="text-sm text-[#6B7280] mt-0.5">{format(new Date(report.datetime), 'PPP p')}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  {report.type === 'TRAINER_CLASS' ? 'Class Report' : 'Training Report'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-[#0F172A]">Topics: </span>
                  <span className="text-[#6B7280]">{report.topics}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#0F172A]">Summary: </span>
                  <span className="text-[#6B7280]">{report.summary}</span>
                </div>
                {report.notes && (
                  <div>
                    <span className="font-semibold text-[#0F172A]">Notes: </span>
                    <span className="text-[#6B7280]">{report.notes}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrainerReportsPage() {
  return (
    <Suspense fallback={<div className="h-48 rounded-3xl bg-white border border-[#E5E7EB] animate-pulse" />}>
      <TrainerReportsContent />
    </Suspense>
  );
}
