'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { downloadCombinedRecordsPdf } from '@/lib/combinedRecordsPdf';
import { downloadCsvFile, downloadExcelCompatibleFile } from '@/lib/combinedRecordsExport';

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

  const buildExportRows = () => {
    const headers = [
      'Date & Time',
      'Trainer',
      'School',
      'Class',
      'Image URL',
      'Topics',
      'Summary',
      'Notes',
    ];

    const rows = records.map((record) => {
      const report = record.reports[0];
      const sessionWhen = report?.datetime || record.attendance?.datetime || record.date;
      const dateTime = format(new Date(sessionWhen), 'PPp');
      const trainer = `${record.trainerName} (${record.trainerEmail})`;
      const classLabel = report?.classLabel || record.attendance?.classLabel || '';
      const imageUrl = record.attendance?.photoUrl?.trim() || '';

      return [
        dateTime,
        trainer,
        record.schoolName,
        classLabel,
        imageUrl,
        report?.topics || '',
        report?.summary || '',
        report?.notes || '',
      ];
    });

    return { headers, rows };
  };

  const generateCSV = () => {
    if (records.length === 0) return;
    const { headers, rows } = buildExportRows();
    downloadCsvFile(`combined-records-${format(new Date(), 'yyyy-MM-dd')}.csv`, headers, rows);
  };

  const generateExcel = () => {
    if (records.length === 0) return;
    const { headers, rows } = buildExportRows();
    downloadExcelCompatibleFile(`combined-records-${format(new Date(), 'yyyy-MM-dd')}.xls`, headers, rows);
  };

  const generatePDF = () => {
    if (records.length === 0) return;
    downloadCombinedRecordsPdf(records, {
      title: 'Combined Attendance & Reports',
      startDate,
      endDate,
    });
  };

  if (loading) {
    return (
      <div className="font-sans text-gray-900">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900">
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Combined Attendance & Reports</h1>
          <div className="flex space-x-3">
            <button
              onClick={generatePDF}
              disabled={records.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📄 Export PDF
            </button>
            <button
              onClick={generateCSV}
              disabled={records.length === 0}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📊 Export CSV
            </button>
            <button
              onClick={generateExcel}
              disabled={records.length === 0}
              className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📈 Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-100">
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
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
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
          <div className="bg-white p-8 rounded-lg shadow-md text-center border border-gray-100">
            <p className="text-gray-600">No records found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                  {records.map((record, idx) => {
                    const report = record.reports[0];
                    const sessionWhen = report?.datetime || record.attendance?.datetime || record.date;
                    const dateTime = format(new Date(sessionWhen), 'PPp');
                    const trainer = `${record.trainerName} (${record.trainerEmail})`;
                    const school = record.schoolName;
                    const classLabel =
                      report?.classLabel || record.attendance?.classLabel || '';
                    const imageUrl = record.attendance?.photoUrl;
                    const rowKey = report?._id || record.attendance?._id || `${idx}`;

                    return (
                      <tr key={rowKey}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dateTime}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{trainer}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {school}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {classLabel || <span className="text-gray-400">-</span>}
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
                          {report?.topics || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {report?.summary || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {report?.notes || <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    );
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
