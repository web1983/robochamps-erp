'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { format } from 'date-fns';

interface AttendanceRecord {
  _id: string;
  schoolId: string;
  trainerId: string;
  classLabel: string;
  datetime: string;
  photoUrl: string;
  trainerName?: string;
  trainerEmail?: string;
  schoolName?: string;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
}

function TrainerAttendanceContent() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      let url = '/api/attendance';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance');
      }

      setRecords(data.records || []);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Attendance Records</h1>
          <p className="text-gray-500">View all your marked attendance</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {records.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-100">
            <p className="text-gray-500">No attendance records found.</p>
            <Link
              href="/trainer/attendance"
              className="mt-4 inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Mark Attendance
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record._id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{record.classLabel}</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">
                        <strong className="text-gray-900">Date & Time:</strong>{' '}
                        {format(new Date(record.datetime), 'PPP p')}
                      </p>
                      {record.schoolName && (
                        <p className="text-gray-600">
                          <strong className="text-gray-900">School:</strong> {record.schoolName}
                        </p>
                      )}
                      {record.geo && (
                        <p className="text-gray-600">
                          <strong className="text-gray-900">📍 Location:</strong>{' '}
                          {record.geo.lat.toFixed(6)}, {record.geo.lng.toFixed(6)}
                          {record.geo.accuracy && (
                            <span className="text-gray-500">
                              {' '}
                              (Accuracy: {record.geo.accuracy.toFixed(2)}m)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <img
                      src={record.photoUrl}
                      alt="Attendance photo"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-emerald-500 transition-colors cursor-pointer"
                      onClick={() => window.open(record.photoUrl, '_blank')}
                      title="Click to view full size"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrainerAttendanceViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
          <DashboardHeader showBackButton backHref="/trainer/dashboard" role="TRAINER_SCHOOL" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <TrainerAttendanceContent />
    </Suspense>
  );
}
