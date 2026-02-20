'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';

interface CombinedRecord {
  date: string;
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  schoolId: string;
  schoolName: string;
  attendance?: {
    _id: string;
    classLabel: string;
    datetime: string;
    photoUrl: string;
    geo?: {
      lat: number;
      lng: number;
      accuracy?: number;
    };
  } | null;
  reports: Array<{
    _id: string;
    type: string;
    classLabel?: string;
    topics: string;
    summary: string;
    notes?: string;
    datetime: string;
  }>;
}

export default function CombinedRecordsPage() {
  const [records, setRecords] = useState<CombinedRecord[]>([]);
  const [schools, setSchools] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate, schoolId, trainerName, trainerEmail]);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      if (response.ok) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let url = '/api/combined-records';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (schoolId) params.append('schoolId', schoolId);
      if (trainerName) params.append('trainerName', trainerName);
      if (trainerEmail) params.append('trainerEmail', trainerEmail);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch records');
      }

      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const escapeCSV = (str: string): string => {
    if (!str) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const escaped = str.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  const generateCSV = () => {
    // Headers
    const headers = [
      'Date & Time',
      'Trainer',
      'School',
      'Attendance',
      'Image URL',
      'Topics',
      'Summary',
      'Notes'
    ];

    // Flatten records - create one row per report, or one row if only attendance exists
    const rows: string[][] = [];

    records.forEach((record) => {
      const dateTime = format(new Date(record.date), 'PPp');
      const trainer = `${record.trainerName} (${record.trainerEmail})`;
      const school = record.schoolName;
      const attendance = record.attendance?.classLabel || '';
      const imageUrl = record.attendance?.photoUrl || '';

      if (record.reports.length > 0) {
        // Create one row per report
        record.reports.forEach((report) => {
          rows.push([
            dateTime,
            trainer,
            school,
            attendance,
            imageUrl,
            report.topics || '',
            report.summary || '',
            report.notes || ''
          ]);
        });
      } else {
        // If no reports but has attendance, create one row
        rows.push([
          dateTime,
          trainer,
          school,
          attendance,
          imageUrl,
          '',
          '',
          ''
        ]);
      }
    });

    // Convert to CSV format
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `combined-records-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateExcel = () => {
    // For Excel, we'll generate CSV with .xls extension (works in Excel)
    // Or we can use a library, but CSV works fine
    generateCSV();
  };

  if (loading) {
    return (
      <div className="min-h-screen ">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1b1d1e' }}>
      <Navbar />
      <div className="max-w-[95%] 2xl:max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Combined Attendance & Reports</h1>
          <div className="flex space-x-3">
            <button
              onClick={generateCSV}
              disabled={records.length === 0}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Export CSV
            </button>
            <button
              onClick={generateExcel}
              disabled={records.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📈 Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Name</label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder="Search by name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Email</label>
              <input
                type="email"
                value={trainerEmail}
                onChange={(e) => setTrainerEmail(e.target.value)}
                placeholder="Search by email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
          </div>
          <div>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSchoolId('');
                setTrainerName('');
                setTrainerEmail('');
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {records.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No records found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trainer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Summary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.flatMap((record, idx) => {
                    const dateTime = format(new Date(record.date), 'PPp');
                    const trainer = `${record.trainerName} (${record.trainerEmail})`;
                    const school = record.schoolName;
                    const attendance = record.attendance?.classLabel || '';
                    const imageUrl = record.attendance?.photoUrl;

                    if (record.reports.length > 0) {
                      // Create one row per report
                      return record.reports.map((report, rIdx) => (
                        <tr key={`${record.date}_${record.trainerId}_${record.schoolId}_${idx}_${rIdx}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dateTime}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {trainer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {school}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {attendance || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt="Attendance"
                                className="w-20 h-20 object-cover rounded border border-gray-300"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {report.topics || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {report.summary || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {report.notes || <span className="text-gray-400">-</span>}
                          </td>
                        </tr>
                      ));
                    } else {
                      // If no reports but has attendance, create one row
                      return (
                        <tr key={`${record.date}_${record.trainerId}_${record.schoolId}_${idx}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dateTime}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {trainer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {school}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {attendance || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt="Attendance"
                                className="w-20 h-20 object-cover rounded border border-gray-300"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">-</td>
                          <td className="px-6 py-4 text-sm text-gray-400">-</td>
                          <td className="px-6 py-4 text-sm text-gray-400">-</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
