'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { format } from 'date-fns';

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
    if (success) {
      alert(decodeURIComponent(success));
    }
  }, [searchParams]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports?type=TRAINER_CLASS');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <DashboardHeader showBackButton backHref="/trainer/dashboard" role="TRAINER_SCHOOL" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <DashboardHeader showBackButton backHref="/trainer/dashboard" role="TRAINER_SCHOOL" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <Link
            href="/trainer/reports/new"
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
          >
            + New Report
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {reports.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-100">
            <p className="text-gray-500 mb-4">No reports found.</p>
            <Link
              href="/trainer/reports/new"
              className="text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Create your first report
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report._id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.classLabel || 'Class Report'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(report.datetime), 'PPP p')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong className="text-gray-900">Topics:</strong>
                    <p className="text-gray-600">{report.topics}</p>
                  </div>
                  <div>
                    <strong className="text-gray-900">Summary:</strong>
                    <p className="text-gray-600">{report.summary}</p>
                  </div>
                  {report.notes && (
                    <div>
                      <strong className="text-gray-900">Notes:</strong>
                      <p className="text-gray-600">{report.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrainerReportsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <DashboardHeader showBackButton backHref="/trainer/dashboard" role="TRAINER_SCHOOL" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <TrainerReportsContent />
    </Suspense>
  );
}
